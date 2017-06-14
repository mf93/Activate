/**
 * Created by mafeld on 4/14/2017.
 */
var state, state2 = 5;
var effect = 6;
var another_state = 5;

var foo = function(parm1, parm2){
    var testState = state;
    effect = 8;
    testState = another_state * 8;
    return "bleh";
}

var bar = function(){
    foo(4,5);
}
