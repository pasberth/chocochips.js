chocochips.js
================

fn
------------

.. code-block:: js

  fn param_1 ... param_n [option_1 = init_1 ... option_n = init_n] -> body

Equivalent to:

.. code-block:: js

  (function (param_1, ..., param_n, option_1, ..., option_n) {
    if (option_1 == null) {
      option_1 = init_1 ;
    }
            :
    if (option_n == null) {
      option_n = init_n ;
    }
    return ( body );
  })

proc
------------

.. code-block:: js

  proc param_1 ... param_n [option_1 = init_1 ... option_n = init_n] {
    stat_1 ;
    stat_2 ;
    :
    stat_n ;
  }

Equivalent to:

.. code-block:: js

  (function (param_1, ..., param_n, option_1, ..., option_n) {
    if (option_1 == null) {
      option_1 = init_1 ;
    }
            :
    if (option_n == null) {
      option_n = init_n ;
    }

    stat_1 ;
    stat_2 ;
      :
    stat_n ;
  })

section
------------

.. code-block:: js

  section {
    stat_1 ;
    stat_2 ;
    :
    stat_n ;
  }

Equivalent to:

.. code-block:: js

    (function () {
      stat_1 ;
      stat_2 ;
      :
      stat_n ;
    })();

Be careful. the section macro complements a semicolon.

when
------------

.. code-block:: js

  when cond {
    stat_1 ;
    stat_2 ;
    :
    stat_n ;
  }

Equivalent to:

.. code-block:: js

  if (cond) {
    stat_1 ;
    stat_2 ;
    :
    stat_n ;
  }

Multimethods
----------------

A port of Clojure's `Multimethods <http://clojure.org/multimethods>`_
See source code.