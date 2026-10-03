# ARlun Language

## Variables

    text name =>> "ARlun"
    number speed =>> 10
    yesno alive =>> true

## Expressions

    number x =>> 10 + 5 * 2
    yesno fast =>> speed >= 10

Supported operators currently include arithmetic, comparison, unary negation, and boolean negation.

## Functions

    function add(a, b) {
        return a + b
    }

    number result =>> add(2, 3)

## Events

    event game_start {
        print "started"
    }

Events are parsed and registered by the runtime. The next engine stage will connect them to actual engine signals such as scene start, collision, input, and network events.

## Naming

The official language/project name is **ARlun**.
