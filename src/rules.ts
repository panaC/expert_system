/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   rules.ts                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: Pierre LEROUX <pleroux@student.42.fr>      +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2019/02/09 17:58:06 by Pierre LERO       #+#    #+#             */
/*   Updated: 2019/02/09 23:52:42 by Pierre LERO      ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

export class Rules {

  constructor(
    private lvalue: string,
    private op: string,
    private rvalue: string) {

  }
}
