import { Engine } from './engine';
import { Parser } from './parser';
import { Lexer } from './lexer';
/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.ts                                            :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Pierre LEROUX <pleroux@student.42.fr>      +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2019/02/09 17:44:40 by Pierre LERO       #+#    #+#             */
/*   Updated: 2019/02/09 17:44:40 by Pierre LERO      ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

if (typeof require !== 'undefined' && require.main === module) {
  try {
    const lexer = new Lexer(process.argv[2]);
    const engine = new Engine();
    lexer.out.forEach(element => {
      const parser = new Parser(element);
      const ast = parser.parse();
      console.log(ast);
      engine.add(ast);
    });
  } catch (e) {
    console.error(e);
  }
}
