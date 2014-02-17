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

let for = macro {
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

MultiFn = proc dispatchFn {
  var list = [];
  var multiFn = proc {
    var x = dispatchFn.apply({}, arguments);
    for f <- list {
      when x === f.dispatchValue {
        return f.func.apply({}, arguments)
      }
    }
  }
  multiFn.list = list;
  return multiFn;
}

let defmulti = macro {
  rule { $name:ident $dispatchFn:expr } => {
    $name = MultiFn($dispatchFn);
  }
}

let defmethod = macro {
  rule { $name:ident $dispatchValue:expr -> $func:expr } => {
    $name.list.push({dispatchValue: $dispatchValue, func: $func})
  }
}

for i <- [1,2,3] {
  for j <- [4,5,6] {
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

console.log(f(1))
console.log(f(2))
console.log(f(3))

export fn;
export proc;
export for;
export section;
export defmulti;
export defmethod;