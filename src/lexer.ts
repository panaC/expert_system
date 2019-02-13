import { Rules } from './rules';
import { Queries } from './queries';
import { Facts } from './facts';
import { readFileSync, writeFileSync } from 'fs';

export class Lexer {
  public varSet = new Map<string, boolean>();

  public rules: Rules[] = [];

  public facts: Facts[] = [];

  public queries: Queries[] = [];

  private rawFile: string;

  private lex: string[][];

  constructor(private filename: string) {
    try {
      this.rawFile = readFileSync(this.filename).toString();
      this.lex = this.shrinkage(this.rawFile)
      .map((s) => this.lexer(s));
    } catch (e) {
      throw new Error(`File error ${e}`);
    }
  }

  public get out() {
    return this.lex;
  }

  private lexer(str: string): string[] {
    return str.split(/(\(|\)|\!|\+|\||\^|=>|<=>|=|\?|[A-Z])/).filter((s) => s.length);
  }

  private shrinkage(raw: string): string[] {
    return raw.replace(/ /g, '')
      .split('\n')
      .map((value) => value.split('#')[0])
      .filter((value) => value.length);
  }
}
