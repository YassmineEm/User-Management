import * as fs from 'fs';
import * as readline from 'readline';
import { promisify } from 'util';
import { LetterIndex, UsersResult, LetterStat, ServiceError } from '../types';

const stat = promisify(fs.stat);

/**
 * Service de gestion du fichier d'utilisateurs
 * Implémente une stratégie d'indexation et de lecture optimisée
 * pour gérer des millions d'utilisateurs sans charger le fichier en mémoire
 */
export class UserFileService {
  private filePath: string;
  private letterIndex: Map<string, LetterIndex> = new Map();
  private totalUsers: number = 0;
  private isIndexed: boolean = false;
  private encoding: BufferEncoding = 'utf8';

  constructor(filePath: string, encoding: BufferEncoding = 'utf8') {
    this.filePath = filePath;
    this.encoding = encoding;
  }

  /**
   * Vérifie si le fichier existe et est accessible
   */
  private async checkFileExists(): Promise<void> {
    try {
      await stat(this.filePath);
    } catch (error) {
      throw new ServiceError(
        `Fichier non trouvé: ${this.filePath}`,
        404,
        'FILE_NOT_FOUND'
      );
    }
  }

  /**
   * Construit l'index du fichier au démarrage
   * Parcourt le fichier une seule fois et crée un mapping lettre → position
   * 
   * Complexité: O(n) où n = nombre total de lignes
   * Mémoire: O(26) pour l'alphabet (constant)
   * 
   * @returns Promise<void>
   */
  async buildIndex(): Promise<void> {
    await this.checkFileExists();

    console.log('🔍 Construction de l\'index du fichier...');
    console.log(`📂 Fichier: ${this.filePath}`);
    
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: this.encoding
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity // Gère les retours à la ligne Windows/Unix
      });

      let lineNumber = 0;
      let currentLetter: string | null = null;
      let letterStartLine = 0;
      let letterCount = 0;

      rl.on('line', (line: string) => {
        const username = line.trim();

        // Ignorer les lignes vides
        if (!username) {
          lineNumber++;
          return;
        }

        const firstLetter = username.charAt(0).toUpperCase();

        // Vérifier que c'est une lettre valide
        if (!/[A-Z]/.test(firstLetter)) {
          console.warn(`⚠️  Ligne ${lineNumber}: premier caractère invalide "${firstLetter}"`);
          lineNumber++;
          return;
        }

        // Nouvelle lettre détectée
        if (firstLetter !== currentLetter) {
          // Sauvegarder l'index de la lettre précédente
          if (currentLetter !== null) {
            this.letterIndex.set(currentLetter, {
              letter: currentLetter,
              startLine: letterStartLine,
              count: letterCount
            });
            
            console.log(`✓ Lettre ${currentLetter}: ${letterCount.toLocaleString()} utilisateurs (ligne ${letterStartLine})`);
          }

          // Initialiser la nouvelle lettre
          currentLetter = firstLetter;
          letterStartLine = lineNumber;
          letterCount = 1;
        } else {
          letterCount++;
        }

        lineNumber++;
        this.totalUsers++;

        // Afficher la progression tous les 1M de lignes
        if (lineNumber % 1000000 === 0) {
          console.log(`📊 Progression: ${lineNumber.toLocaleString()} lignes indexées...`);
        }
      });

      rl.on('close', () => {
        // Sauvegarder la dernière lettre
        if (currentLetter !== null) {
          this.letterIndex.set(currentLetter, {
            letter: currentLetter,
            startLine: letterStartLine,
            count: letterCount
          });
          
          console.log(`✓ Lettre ${currentLetter}: ${letterCount.toLocaleString()} utilisateurs (ligne ${letterStartLine})`);
        }

        this.isIndexed = true;
        const duration = Date.now() - startTime;
        
        console.log('\n✅ Indexation terminée avec succès!');
        console.log(`⏱️  Durée: ${(duration / 1000).toFixed(2)} secondes`);
        console.log(`👥 Total utilisateurs: ${this.totalUsers.toLocaleString()}`);
        console.log(`🔤 Lettres indexées: ${this.letterIndex.size}`);
        console.log('');

        resolve();
      });

      rl.on('error', (error) => {
        console.error('❌ Erreur lors de l\'indexation:', error);
        reject(new ServiceError(
          'Erreur lors de la lecture du fichier',
          500,
          'INDEXING_ERROR'
        ));
      });
    });
  }

  /**
   * Récupère les utilisateurs pour une lettre donnée avec pagination
   * 
   * Complexité: O(k) où k = limit (nombre d'utilisateurs demandés)
   * La lecture s'arrête dès que les k utilisateurs sont trouvés
   * 
   * @param letter - Lettre de l'alphabet (A-Z)
   * @param offset - Position de départ (0-indexed)
   * @param limit - Nombre maximum d'utilisateurs à retourner
   * @returns Promise<UsersResult>
   */
  async getUsersByLetter(
    letter: string,
    offset: number = 0,
    limit: number = 50
  ): Promise<UsersResult> {
    // Vérification de l'état
    if (!this.isIndexed) {
      throw new ServiceError(
        'Index non construit. Appelez buildIndex() d\'abord.',
        500,
        'INDEX_NOT_BUILT'
      );
    }

    // Validation des paramètres
    if (!/^[A-Z]$/.test(letter)) {
      throw new ServiceError(
        'La lettre doit être comprise entre A et Z',
        400,
        'INVALID_LETTER'
      );
    }

    if (offset < 0) {
      throw new ServiceError(
        'L\'offset doit être >= 0',
        400,
        'INVALID_OFFSET'
      );
    }

    if (limit < 1 || limit > 1000) {
      throw new ServiceError(
        'La limite doit être entre 1 et 1000',
        400,
        'INVALID_LIMIT'
      );
    }

    const letterUpper = letter.toUpperCase();
    const index = this.letterIndex.get(letterUpper);

    // Lettre non trouvée dans l'index
    if (!index) {
      return {
        users: [],
        total: 0,
        hasMore: false
      };
    }

    // Vérifier si l'offset dépasse le nombre total
    if (offset >= index.count) {
      return {
        users: [],
        total: index.count,
        hasMore: false
      };
    }

    // Calculer les lignes à lire
    const startLine = index.startLine + offset;
    const endLine = Math.min(startLine + limit, index.startLine + index.count);

    // Lire les lignes du fichier
    const users = await this.readLines(startLine, endLine);

    return {
      users,
      total: index.count,
      hasMore: offset + limit < index.count
    };
  }

  /**
   * Lit un intervalle de lignes spécifique du fichier
   * Utilise un stream pour éviter de charger tout le fichier en mémoire
   * S'arrête dès que l'intervalle est lu (optimisation cruciale)
   * 
   * @param startLine - Ligne de début (inclusive)
   * @param endLine - Ligne de fin (exclusive)
   * @returns Promise<string[]>
   */
  private async readLines(startLine: number, endLine: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(this.filePath, {
        encoding: this.encoding
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      const result: string[] = [];
      let currentLine = 0;

      rl.on('line', (line: string) => {
        // Collecter seulement les lignes dans l'intervalle demandé
        if (currentLine >= startLine && currentLine < endLine) {
          const username = line.trim();
          if (username) {
            result.push(username);
          }
        }

        currentLine++;

        // 🚀 OPTIMISATION CRITIQUE
        // Arrêter la lecture dès qu'on a toutes les lignes nécessaires
        // Évite de parcourir inutilement le reste du fichier
        if (currentLine >= endLine) {
          rl.close();
          fileStream.destroy();
        }
      });

      rl.on('close', () => {
        resolve(result);
      });

      rl.on('error', (error) => {
        console.error('Erreur lors de la lecture des lignes:', error);
        reject(new ServiceError(
          'Erreur lors de la lecture du fichier',
          500,
          'READ_ERROR'
        ));
      });

      fileStream.on('error', (error) => {
        console.error('Erreur du stream:', error);
        reject(new ServiceError(
          'Erreur du stream de fichier',
          500,
          'STREAM_ERROR'
        ));
      });
    });
  }

  /**
   * Retourne les statistiques globales (nombre d'utilisateurs par lettre)
   * Utilisé pour générer le menu alphabétique côté frontend
   * 
   * @returns LetterStat[]
   */
  getStats(): LetterStat[] {
    if (!this.isIndexed) {
      throw new ServiceError(
        'Index non construit. Appelez buildIndex() d\'abord.',
        500,
        'INDEX_NOT_BUILT'
      );
    }

    return Array.from(this.letterIndex.values())
      .map(index => ({
        letter: index.letter,
        count: index.count
      }))
      .sort((a, b) => a.letter.localeCompare(b.letter));
  }

  /**
   * Retourne le nombre total d'utilisateurs
   * @returns number
   */
  getTotalUsers(): number {
    return this.totalUsers;
  }

  /**
   * Vérifie si l'index a été construit
   * @returns boolean
   */
  isReady(): boolean {
    return this.isIndexed;
  }

  /**
   * Retourne les informations d'index pour une lettre
   * @param letter - Lettre (A-Z)
   * @returns LetterIndex | undefined
   */
  getLetterInfo(letter: string): LetterIndex | undefined {
    return this.letterIndex.get(letter.toUpperCase());
  }

  /**
   * Retourne toutes les lettres disponibles
   * @returns string[]
   */
  getAvailableLetters(): string[] {
    return Array.from(this.letterIndex.keys()).sort();
  }
}