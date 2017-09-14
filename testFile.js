/**
 * Created by mafeld on 4/14/2017.
 */
var state = 5, state2 = 5;
var effect = 6;
var another_state = 5;



var foo = function(parm1, parm2){

    //local should be considered a local variable
    var local = 6;

    //there should be no warnings
    local = 9;

    //STATE
    local = state;

    //no warnings
    var testState = 6;

    //SIDE EFFECT this should trigger a side effect warning
    effect = 8;

    //NOT SIDE EFFECT this should trigger a side effect warning
    local += 7; //state = 12

    //TODO: check through assignments for any instance of state or 2nd order

    //NOT STATE this should trigger a state warning
    testState = local;

    local = 6;

    //this should no longer be a state warning
    testState = local;


    return "bleh";
}

var bar = function(){
    foo(4,5);
}

bar();