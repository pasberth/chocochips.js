let setdefault = macro {
  rule { { $($var:ident = $init:expr) (,) ... } } => {
    $(if ($var == null) { $var = $init }) ...
  }
}

let fn = macro {
  rule { $params:ident ... -> $body:expr } => {
    (function ($params ...) {
      return ($body) ;
    })
  }

  rule { $params:ident ... [$($option:ident = $init:expr) ...] -> $body:expr } => {
    (function ($params ... $option ...) {
      setdefault { $($option = $init) (,) ... }
      return ($body) ;
    })
  }
}

let proc = macro {
  rule { $params:ident ... { $body ... } } => {
    (function ($params ...) {
      $body ...
    })
  }

  rule { $params:ident ... [$($option:ident = $init:expr) ...] { $body ... } } => {
    (function ($params ... $option ...) {
      setdefault { $($option = $init) (,) ... }
      $body ...
    })
  }
}

let foreach = macro {
  rule { $param:ident <- $things:expr { $body ... } } => {
    for (var _i = 0; _i < $things.length; _i++) {
        var $param = $things[_i];
        $body ...
    };
  }
}

let section = macro {
  rule { { $stat ... } } => {
    (function () {
      $stat ...
    })();
  }
}

let when = macro {
  rule { $cond:expr { $stat ... } } => {
    if ($cond) { $stat ... }
  }
}

let defmulti = macro {
  rule { $name:ident $dispatchFn:expr } => {
    section {
      MultiFn = proc dispatchFn {
          var list = [];
          var multiFn = proc {
          var x = dispatchFn.apply({}, arguments);
          foreach f <- list {
            when x === f.dispatchValue {
              return f.func.apply({}, arguments)
            }
          }
        }
        multiFn.list = list;
        return multiFn;
      }

      $name = MultiFn($dispatchFn);
    }
  }
}

let defmethod = macro {
  rule { $name:ident $dispatchValue:expr -> $func:expr } => {
    $name.list.push({dispatchValue: $dispatchValue, func: $func})
  }
}

defmulti unit (fn cxt a -> cxt);
defmulti bind (fn cxt m f -> cxt);

then = fn cxt m k -> bind(cxt, m, fn _ -> k);


let do = macro {
  case { _ $cxt:ident { $body ... } } => {
    var tokens = #{$body ...};
    var monads = []; /* where monads :: [{ x, m }]; x is bind; m is monad.  */

    for (var i = 0; i < tokens.length; i++) {

      /*
       * `` x <- m ; "
       */
       //console.log(i)
       //console.log(tokens[i])
      if (    i + 3 < tokens.length
          &&  tokens[i].token.type    === 3 /* Identifier */
          &&  tokens[i+1].token.type  === 7 /* Punctuator */
          &&  tokens[i+2].token.type  === 7 /* Punctuator */
          &&  tokens[i+1].token.value === '<'
          &&  tokens[i+2].token.value === '-'
          ) {

        var tmp = { x: tokens[i], m: [] };
        monads.push(tmp);

        /* Take tokens while a semicolon is. */
        for (var j = i + 3; j < tokens.length; j++) {
          if (    tokens[j].token.type  === 7 /* Punctuator */
              &&  tokens[j].token.value === ';') {
            i = j; /* Skip tokens while a semicolon is. */
            break;
          }
          tmp.m.push(tokens[j]);
        };
      }
      /*
       * `` return expr ; "
       */
      else if (     tokens[i].token.type  === 4 /* Keyword */
                &&  tokens[i].token.value === "return" ) {
        var expr = []

        for (var j = i + 1 /* drop keyword ``return" */ ; j < tokens.length; j++) {
          if (    tokens[j].token.type  === 7 /* Punctuator */
              &&  tokens[j].token.value === ';') {
            i = j; /* Skip tokens while a semicolon is. */
            break;
          }
          expr.push(tokens[j]);
        };
        
        /* ``return $expr ;" is expanded to `` unit($cxt, $expr) " */
        var m = [ makeIdent("unit", null)
                , makeDelim("()", (#{$cxt}).concat([makePunc(",", null)]).concat(expr), null)
                ]
        console.log(m)
        monads.push({ x: null, m: m })
      }
      /*
       * `` m ; "
       */
      else {
        var m = [];
        for (var j = i; j < tokens.length; j++) {
          if (    tokens[j].token.type  === 7 /* Punctuator */
              &&  tokens[j].token.value === ';') {
            i = j; /* Skip tokens while a semicolon is. */
            break;
          }
          m.push(tokens[j]);
        };
        monads.push({ x: null, m: m })
      }
    };

    //console.log("(* cxt *)")
    //console.log(#{$cxt});
    //console.log("(* body ... *)")
    //console.log(#{$body ...});
    //console.log("(* monads *)")
    //console.log(monads);

    return monads.reduceRight(proc x y {
      if (y.x == null) {
        return {
          x: null
        , m: [makeIdent("then", null), makeDelim("()", #{$cxt}.concat([makePunc(',', null)]).concat(y.m).concat([makePunc(',', null)]).concat(x.m), null)]
        }
      } else {
        return {
          x: null
        , m: [makeIdent("bind", null), makeDelim("()", #{$cxt}.concat([makePunc(',', null)]).concat(y.m).concat([makePunc(',', null)]).concat([makeKeyword("function", null), makeDelim("()", [y.x], null), makeDelim("{}", [makeKeyword("return", null)].concat(x.m), null) ]), null)]
        }
      }
    }).m
  }

  /* ???
  rule { $cxt:ident { $x:ident <- $m:expr (;) ...; return $ret:expr } } => {
    bind($)
  }
  rule { $cxt:ident { $x:ident <- $m:expr ; $stat ... } } => {
    //bind($cxt, $m, (fn $x -> (do $cxt { $stat ... })))
    //bind($cxt, $m, (function ($x) { return ( do $cxt { $stat ... } ) }))
    bind($cxt, $m, (function ($x) { return ( do $cxt { $stat ... } ) }))
  }
  rule { $cxt:ident { return $x:expr ; } } => {
    unit($cxt, $x)
  }
  rule { $cxt:ident { $m:expr ; $stat ... } } => {
    then($cxt, $m, (do $cxt { $stat ... }))
  }*/
}


defmethod unit Array -> (fn _ a -> [a]);
defmethod bind Array -> (fn _ m f -> m.reduce(fn x y -> x.concat(f(y)), []))

foreach i <- [1,2,3] {
  foreach j <- [4,5,6] {
    console.log(i);
    console.log(j);
  }
}

fn -> x;
fn x y z -> x ;
fn x [y = "y"] -> y;
fn x [y="y" z="z"] -> z;

//setdefault { x = "a" , y = "b" , z = "c" }

section {
  console.log("a");
  console.log("b");
  console.log("c");
}

defmulti f (fn x -> x );
defmethod f 1 -> (fn _ -> "ok!");
defmethod f 2 -> (fn _ -> "no!");

console.log(f(1));
console.log(f(2));
console.log(f(3));

/*
do Array {
  i <- [1,2,3] ;
  j <- [4,5,6] ;
  return [i,j] ;
}
*/

console.log(do Array { i <- [1,2,3] ; return i ; });
console.log(do Array { [1,2,3] ; return 42 ; });
console.log(do Array { return 42 ; });
console.log(do Array { i <- [1,2,3] ; j <- [4,5,6] ; return [i,j] ; })
// this is not working. why????
// console.log(do Array { i <- [1,2,3] ; j <- [4,5,6] ; return [i,j] })
//console.log(bind(Array,[1,2,3], fn i -> bind(Array,[4,5,6], fn j -> unit(Array,[i,j]))))

export fn;
export proc;
export foreach;
export section;
export defmulti;
export defmethod;
export do;