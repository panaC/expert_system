import { Facts } from './facts';
import { IAst, Parser } from './parser';
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

  private graph: Igraph = {};
  private node: INode = {};
  private queries: string[] = [];
  private facts: string[] = [];
  private dfs: Idfs = {};

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
    return (createHash('md5').update(JSON.stringify(ast))).digest('base64');
  }

  private static initIn(name: string, asttype: string): Iname[] {
    const ret: Iname[] = [];
    if (asttype === 'VAR') {
      ret.push({ name: (name !== null ? name : 'init'), state: Estate.false });
    }
    return ret;
  }

  private setGraph(ast: IAst, pid: string = null) {
    if (ast === null) {
      return ;
    }
    if (pid === null && ast.type === 'ASS') {
      this.setGraph(ast.right, (ast.value === '<=>') ? Engine.nodeName(ast.left) : Engine.nodeName(ast.right));
      this.setGraph(ast.left, Engine.nodeName(ast.right));
      return;
    }
    const name = Engine.nodeName(ast);
    if (!this.node[name]) {
      this.node[name] = {
        type: ast.type,
        value: ast.value,
        state: {
          out: (ast.type === 'VAR' ? Estate.false : Estate.undef),
          in: Engine.initIn(pid, ast.type),
        },
      };
    }
    if (pid) {
      if (!this.graph[name]) {
        this.graph[name] = [];
      }
      if (this.graph[name].findIndex((n) => n === pid) === -1 && name !== pid) {
        this.graph[name].push(pid);
      }
    }
    this.setGraph(ast.left, name);
    this.setGraph(ast.right, name);
  }

  private astToArrayVar(ast: IAst, array: string[]) {
    if (ast !== null) {
      this.astToArrayVar(ast.left, array);
      this.astToArrayVar(ast.right, array);
      if (ast.type === 'VAR') {
        if (this.node[ast.value]) {
          array.push(ast.value);
        } /*else {
          throw new Error(`'${ast.value}' is unknown in Variable set`);
        }*/
      }
    }
  }

  public add(ast: IAst) {
    if (ast.type === 'INP') {
      // add facts or rules
      if (ast.value === '?') {
        this.astToArrayVar(ast, this.queries);
        Object.keys(this.graph).forEach((fact) => {
          if (Parser.typeTab.VAR.test(fact) && this.queries.findIndex((n) => fact === n) === -1) {
            console.log(`Run ${fact}`);
            this.dfs = {};
            this.run(fact);
          }
        });
        /*this.facts.map((fact) => {
            this.dfs = {};
            this.run(fact);
        });*/
        this.queries.forEach((querie) => {
          // do something with this variable found its state
          if (this.node[querie]) {
            let state = this.node[querie].state.out;
            if (state === Estate.undef) {
              state = Estate.false;
            }
            console.log(`'${querie}' type is '${state}'`);
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
            this.node[element].state.in.push({ name: 'init', state: Estate.true });
          }
        });
      }
    } else {
      this.setGraph(ast);
    }

    
    console.log('Node:');
    console.log(this.node);
    console.log('Graph:');
    console.log(this.graph);
    console.log('facts:');
    console.log(this.facts);
    console.log('queries:');
    console.log(this.queries);
    
  }

  private static op(acc: Estate, type: string, sta: Estate) {
    if (acc === Estate.undef) {
      return (type === 'NOT' ? (sta === Estate.true ? Estate.false : Estate.true) : sta);
    }
    const l = acc === Estate.true ? true : false;
    const r = sta === Estate.true ? true : false;
    let ret: boolean = false;
    console.log('HELLO', type);
    

    switch (type) {
      case 'XOR':
        const xor = (a: boolean, b: boolean) => (a || b) && !(a && b);
        ret = xor(l, r);
        break;
      case 'OR':
        ret = l || r;
        break;
      case 'AND':
        ret = l && r;
        break;
      case 'NOT':
        ret = !(l || r);
        console.log('HELLO NOT', ret);
        
        break;
      case 'VAR':
        ret = l || r;
        console.log('HELLO VAR', ret);
        break;
    }
    return (ret === true ? Estate.true : Estate.false);
  }

  private run(str: string) {
    // exec pathfinding from str var in graph
    /*if (this.graph[str] === undefined || (this.graph[str].length === 0 || this.graph[str].map((n) => this.dfs[n]).reduce((a, c) => a && c))) {
      return ;
    }*/

    console.log('RUN', str);
    
    this.dfs[str] = true;
    // if (this.node[str].type !== 'VAR') {
    try {
      this.node[str].state.out = this.node[str].state.in
      .reduce((a, c) => {
        console.log('RUN', str);
        return { name: '', state: Engine.op(a.state, this.node[str].type, c.state) };
      }, /* ici il doit y avoir une valeur d'initialisation mais false or true influe*/{ name: '', state: Estate.undef }).state;
    } catch (e) {
      console.log(`run 1 ${str}`);
    }
    try {
      this.graph[str].map((n) => {
        const index = this.node[n].state.in.findIndex((v) => v.name === str);
        if (index > -1) {
          this.node[n].state.in[index].state = this.node[str].state.out;
        } else {
          this.node[n].state.in.push({ name: str, state: this.node[str].state.out });
        }
      });
    } catch (e) {
      console.log(`run ${str}`);
    }
    /*} else {
      this.graph[str].map((n) => this.node[n].state.in.push({name: str, state: this.node[str].state.out}));
      this.graph[str].map((n) => this.node[n].state.out);
    }*/
    try {
      this.graph[str].map((n) => {
        if (!this.dfs[n]) {
          this.run(n);
        }
      });
    } catch (e) {
      console.log(`run ${str}`);
    }
    /*} else {
      */
  }
}
