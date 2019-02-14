import { IAst } from './parser';
import { createHash } from 'crypto';

interface Iname {
  name: string;
  state: Estate;
}

interface INode {
  [name: string]: {
    type: string;
    value: string;
    state: {
      out: Estate;
      in: Iname[];
    }
  };
}

interface Igraph {
  [name: string]: string[];
}

// make a cross if already pass in algo
interface Idfs {
  [name: string]: boolean;
}

enum Estate {
  false = 'false',
  true = 'true',
  undef = 'undefined',
}

export class Engine {

  private graph: Igraph;
  private node: INode;
  private queries: string[] = [];
  private facts: string[] = [];
  private dfs: Idfs;

  private setVariable(ast: IAst) {
    if (ast.left === null && ast.right === null) {
      if (ast.type === 'VAR') {
        if (this.node[ast.value]) {
          this.node[ast.value].state.out = Estate.true;
        } else {
          throw new Error(`Value '${ast.value}' is unknown in Variable set`);
        }
      } else {
        throw new Error(`Type '${ast.type}' is unknown`);
      }
    } else {
      this.setVariable(ast.left);
      this.setVariable(ast.right);
    }
  }

  private static nodeName(ast: IAst) {
    if (ast.type === 'VAR') {
      return ast.value;
    }
    return (createHash('md5').update(JSON.stringify(ast))).digest('hex');
  }

  private setGraph(ast: IAst, pid: string = null) {
    if (ast.left == null && ast.right == null) {
      return;
    }
    if (pid === null && ast.type === 'ASS') {
      this.setGraph(ast.right, (ast.value === '<=>') ? Engine.nodeName(ast.left) : null);
      this.setGraph(ast.left, Engine.nodeName(ast.right));
      return;
    }

    const name = Engine.nodeName(ast);
    if (!this.node[name]) {
      this.node[ast.left.value] = {
        type: ast.right.type,
        value: ast.right.value,
        state: {
          out: Estate.false/*Estate.undef //by default is false but if the ruleset is ambigous become undefined, apply ?*/,
          in: [],
        },
      };
      if (pid) {
        this.graph[name].push(pid);
      }
    }
    this.setGraph(ast.left, name);
    this.setGraph(ast.right, name);
  }

  private astToArrayVar(ast: IAst, array: string[]) {
    if (ast.left === null && ast.right === null) {
      if (ast.type === 'VAR') {
        if (this.node[ast.value]) {
          array.push(ast.value);
        } else {
          throw new Error(`'${ast.value}' is unknown in Variable set`);
        }
      } else {
        throw new Error(`Type '${ast.type}' is unknown`);
      }
    } else {
      this.astToArrayVar(ast.left, array);
      this.astToArrayVar(ast.right, array);
    }
  }

  public add(ast: IAst) {
    if (ast.type === 'INP') {
      // add facts or rules
      if (ast.value === '?') {
        this.astToArrayVar(ast, this.queries);
        this.queries.forEach((querie) => {
          // do something with this variable found its state
          if (this.node[querie]) {
            console.log(`'${querie}' type is '${this.node[querie].state}`);
          } else {
            console.log(`'${querie} is unknown in variable set`);
          }
        });
        this.queries = [];
      } else {
        // set true to variable state
        // this.setVariable(ast);
        this.astToArrayVar(ast, this.facts);
        this.facts.forEach((element) => {
          if (this.node[element]) {
            this.node[element].state.out = Estate.true;
          }
        });
        this.facts.forEach((fact) => {
          this.run(fact);
        });
      }
    } else {
      this.setGraph(ast);
    }
  }

  private static op(acc: Estate, type: string, sta: Estate) {
    const l = acc === Estate.true ? true : false;
    const r = sta === Estate.true ? true : false;
    let ret: boolean = false;

    switch (type) {
      case 'XOR':
        const xor = (a: boolean, b: boolean) => ( a || b ) && !( a && b );
        ret = xor(l, r);
        break;
      case 'OR':
        ret = l || r;
        break;
      case 'AND':
        ret = l && r;
        break;
      case 'NOT':
        ret = !r;
        break;
    }
    return (ret === true ? Estate.true : Estate.false);
  }

  private run(str: string) {
    // exec pathfinding from str var in graph
    if (this.graph[str].length === 0 || this.graph[str].map((n) => this.dfs[n]).reduce((a, c) => a && c)) {
      return ;
    }
    if (this.node[str].type !== 'VAR') {
      this.node[str].state.out = this.node[str].state.in
      .reduce((a, c) => {
        return { name: '', state: Engine.op(a.state, this.node[str].type, c.state)};
      }).state;
      this.graph[str].map((n) => {
        const index = this.node[n].state.in.findIndex((v) => v.name === str);
        if (index > -1) {
          this.node[n].state.in[index].state = this.node[str].state.out;
        } else {
          this.node[n].state.in.push({name: str, state: this.node[str].state.out});
        }
      });
    } else {
      this.graph[str].map((n) => this.node[n].state.in.push({name: str, state: this.node[str].state.out}));
    }
    this.graph[str].map((n) => this.run(n));
  }
}
