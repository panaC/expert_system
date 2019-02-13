import { IAst } from './parser';

interface INode {
  [name: string]: {
    type: string;
    value: string;
    state: Estate.undef;
  };
}

interface Igraph {
  [name: string]: string[];
}

enum Estate {
  false,
  true,
  undef,
}

export class Engine {

  private i = 0;
  private graph: Igraph;
  private node: INode;
  private queries: string[] = [];

  private setVariable(ast: IAst, state: Estate = Estate.false) {
    if (ast.left === null && ast.right === null) {
      if (ast.type === 'VAR') {
        if (state !== Estate.undef) {
          if (this.variable[ast.value]) {
            this.variable[ast.value] = state;
          } else {
            throw new Error(`Value '${ast.value}' is unknown in Variable set`);
          }
        } else {
            this.variable[ast.value] = state;
        }
      } else {
        throw new Error(`Type '${ast.type}' is unknown`);
      }
    } else {
      this.setVariable(ast.left, state);
      this.setVariable(ast.right, state);
    }
  }

  private setGraph(ast: IAst) {
    if ((ast.left === null || ast.left.type === 'VAR') && ast.right.type === 'VAR') {
      this.node[(++this.i).toString()] = {
        type: ast.type,
        value: ast.value,
        state: Estate.undef,
      };
      if (ast.left && !this.node[ast.left.value]) {
        this.node[ast.left.value] = {
          type: ast.right.type,
          value: ast.right.value,
          state: Estate.undef,
        };
        this.graph[ast.left.value].push(this.i.toString());
      }
      if (!this.node[ast.right.value]) {
        this.node[ast.right.value] = {
          type: ast.right.type,
          value: ast.right.value,
          state: Estate.undef,
        };
        this.graph[ast.right.value].push(this.i.toString());
      }
    } else {
      this.setGraph(ast.left);
      this.setGraph(ast.right);
    }
  }

  private astToArrayVar(ast: IAst) {
    if (ast.left === null && ast.right === null) {
      if (ast.type === 'VAR') {
        if (this.variable[ast.value]) {
          this.queries.push(ast.value);
        } else {
          throw new Error(`'${ast.value}' is unknown in Variable set`);
        }
      } else {
        throw new Error(`Type '${ast.type}' is unknown`);
      }
    } else {
      this.astToArrayVar(ast.left);
      this.astToArrayVar(ast.right);
    }
  }

  public add(ast: IAst) {
    if (ast.type === 'INP') {
      // add facts or rules
      if (ast.value === '?') {
        // do something => run the engine
        this.astToArrayVar(ast);
        this.queries.forEach((element) => {
          const state = this.variable[element];
          // do something with this variable found its state
        });
      } else {
        // set true to variable state
        this.setVariable(ast, Estate.true);
      }
    } else {
      // this.astRules.push(ast);
      // set false to variable state
      // this.setVariable(ast, Estate.false);

    }
  }

  public run() {

  }
}
