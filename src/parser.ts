
interface IType {
  [name: string]: RegExp;
}

export interface IAst {
  type: string;
  value: string;
  left: IAst;
  right: IAst;
}

export class Parser {

  constructor(private tokens: string[]) {
    this.value = this.tokens[0];
  }

  private current = 0;
  private value = '';
  private pvalue = '';

  private typeTab: IType = {
    INP: RegExp(/\=|\?/),
    ASS: RegExp(/=>|<=>/),
    XOR: RegExp(/\^|xor|XOR/),
    OR: RegExp(/\||or|OR/),
    AND: RegExp(/\+|and|AND/),
    NOT: RegExp(/\!|not|NOT/),
    PO: RegExp(/\(/),
    PC: RegExp(/\)/),
    VAR: RegExp(/[A-Z]/),
  };

  private get getToken() {
    return this.value;
  }

  private getNextToken() {
    this.pvalue = this.value;
    if (this.current === this.tokens.length) {
      this.value = 'EOL';
    } else {
      this.value = this.tokens[++this.current];
    }
    return this.value;
  }

  private match(type: RegExp) {
    if (type.test(this.getToken)) {
      this.getNextToken();
      return true;
    }
    return false;
  }

  public parse(): IAst {
    if (this.match(this.typeTab.INP)) {
      const val = this.tokens[this.current - 1];
      const rvalue = this.univar();
      return {
        type: 'INP',
        value: val,
        left: null,
        right: rvalue,
      };
    }
    return this.expr();
  }

  public expr(): IAst {
    const lvalue = this.xorop();

    if (this.match(this.typeTab.ASS)) {
      const val = this.tokens[this.current - 1];
      const rvalue = this.xorop();
      return {
        type: 'ASS',
        value: val,
        left: lvalue,
        right: rvalue,
      };
    }
    throw new SyntaxError('Assignement token is expected like =>,<=>,=,?');
  }

  private xorop(): IAst {
    const lvalue = this.orop();

    if (this.match(this.typeTab.XOR)) {
      const rvalue = this.xorop();
      return {
        type: 'XOR',
        value: '^',
        left: lvalue,
        right: rvalue,
      };
    }
    return lvalue;
  }

  private orop(): IAst {
    const lvalue = this.andop();

    if (this.match(this.typeTab.OR)) {
      const rvalue = this.orop();
      return {
        type: 'OR',
        value: '|',
        left: lvalue,
        right: rvalue,
      };
    }
    return lvalue;
  }

  private andop(): IAst {
    const lvalue = this.notop();

    if (this.match(this.typeTab.AND)) {
      const rvalue = this.andop();
      return {
        type: 'AND',
        value: '+',
        left: lvalue,
        right: rvalue,
      };
    }
    return lvalue;
  }

  private notop(): IAst {
    if (this.match(this.typeTab.NOT)) {
      const rvalue = this.notop();
      return {
        type: 'NOT',
        value: '!',
        left: null,
        right: rvalue,
      };
    }
    return this.atom();
  }

  private atom(): IAst {
    const val = this.getToken;
    if (this.value === 'EOL') {
      // fin du parsing;
    }
    if (this.match(this.typeTab.VAR)) {
      return {
        type: 'VAR',
        value: val,
        left: null,
        right: null,
      };
    } else if (this.match(this.typeTab.PO)) {
      this.xorop();
      if (!this.match(this.typeTab.PC)) {
        throw new SyntaxError(`')' expected at column ${this.current + 1}`);
      }
    }
    throw new SyntaxError(`'${this.getToken}' is unknown at column ${this.current + 1}`);
  }

  private univar(): IAst {
    if (this.match(this.typeTab.VAR)) {
      return {
        type: 'VAR',
        value: this.pvalue,
        left: null,
        right: this.univar(),
      };
    } else if (!this.value || this.value === 'EOL') {
      return null;
    }
    throw new SyntaxError(`'${this.getToken}' is unknown at column ${this.current + 1}`);
  }
}
