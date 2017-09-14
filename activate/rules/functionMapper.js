/**
 * @fileoverview Rule to map out all state and side effects in a pedantic way for unit testing
 * @author Matt Feld
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require("../node_modules/eslint/lib/ast-utils");

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

var functionStack = [];

module.exports = {
    meta: {
        docs: {
            description: "take note of all side effects",
            category: "docblock",
            recommended: false
        },

        schema: [
            {
                enum: ["unix", "windows"]
            }
        ]
    },

    create(context) {
        const SIDE_EFFECT_MSG = "`{{funcName}}`: SIDE EFFECT : `{{name}}` is a side effect on line `{{lineNum}}`";
        const STATE_MSG = "`{{funcName}}` : STATE : `{{name }}` is a non-local variable referenced from within `{{funcName}}` on line `{{lineNum}}`"
        const SECOND_ORDER_MSG = "`{{funcName}}` : SECOND_ORDER : `{{funcCall}}` is a second-order function call within this method"

        const sourceCode = context.getSourceCode();

        var pushFunctionToStack = function (node) {
            functionStack.push({func: node, localVars: {}, nonLocalVars: {}, parameters: {}});
        }

        var popFunctionFromStack = function (node) {
            functionStack.pop();
        }

        var reportFunctionCall = function(node, scope) {

        };

        //Input Reporting
        var reportFunctionInput = function (node, scope) {

        };
        var reportStateInput = function (node, scope) {

        };
        var reportReturnedFunctionCallInput = function (node, scope) {

        };
        var reportChainedFunctionCallInput = function (node, scope) {

        };
        var reportParametersInput = function(node, scope){

        };

        //Input Discovery
        var isChainedFunctionCall = function (node, scope) {

        };
        var isReturnedFunctionCall = function (node, scope) {

        };
        var isOutsideLocalScope = function (node, scope) {

        };

        //Output Reporting
        var reportReturnStatementOutput = function(node, scope) {

        };
        var reportSideEffectOutput = function(node, scope) {

        };
        var reportParameterPropertyAssignmentOutput = function(node, scope) {

        };
        var reportParametersPassedToFunctionCallOutput = function(node, scope) {

        };

        //Output Discovery
        var isSideEffect = function(node, scope) {
          var isBaseSideEffect = function(node, scope) {
              //checking if its a nonlocal variable
          };
          var isPropertySideEffect = function(node, scope) {
              //checking transitivity on the point
          };

          return isBaseSideEffect(node, scope) || isPropertySideEffect(node, scope);
        };
        var isParameterPropertyAssignment = function(node, scope) {

        };

        var isOutput = function (node, scope) {
            var nonLocalVar = !!scope && !scope.localVars.hasOwnProperty(node.left.name.split('.')[0]);
            // var receivedState = !!scope && Object.keys(scope.nonLocalVars).some(function(k){ return node.left.name.startsWith(k) });
            if (nonLocalVar) {//|| receivedState){
                var name = node.left.name;
                var funcName = scope.func.id ? scope.func.id : '';
                if (funcName === '' && scope.func.parent.id) {
                    funcName = scope.func.parent.id.name;
                }
                var lineNum = node.loc.start.line;
                scope.nonLocalVars[name] = node.left;
                context.report({
                    node,
                    message: SIDE_EFFECT_MSG,
                    data: {
                        funcName,
                        name,
                        lineNum

                    }
                });
            }
        };
        var isDeclaratorInput = function (node, scope) {
            var isNonLocalVar = !!node.init.name && !scope.localVars.hasOwnProperty(node.init.name.split('.')[0]);
            //var isTransitiveState = !!scope.nonLocalVars.hasOwnProperty(node.init.name.split('.')[0];
            if (isNonLocalVar) {
                var name = node.init.name;
                var funcName = scope.func.id ? scope.func.id : '';
                if (funcName === '' && scope.func.parent.id) {
                    funcName = scope.func.parent.id.name;
                }
                var lineNum = node.loc.start.line;
                context.report({
                    node,
                    message: STATE_MSG,
                    data: {
                        name,
                        funcName,
                        lineNum

                    }
                });
                scope.nonLocalVars[node.id.name] = node.id;
                return true;
            }
            return false;
        }
        var isAssignmentInput = function (node, scope) {
            var notInLocalScope = !!node.right.name && !scope.localVars.hasOwnProperty(node.right.name.split('.')[0]);
            //var transitiveStateAssignment = !!node.right.name && Object.keys(scope.nonLocalVars).some(function(k){ return node.right.name.startsWith(k) });
            if (notInLocalScope) {// || transitiveStateAssignment){
                var name = node.right.name;
                var funcName = scope.func.id ? scope.func.id : '';
                if (funcName === '' && scope.func.parent.id) {
                    funcName = scope.func.parent.id.name;
                }
                var lineNum = node.loc.start.line;
                context.report({
                    node,
                    message: STATE_MSG,
                    data: {
                        name,
                        funcName,
                        lineNum

                    }
                });
                scope.nonLocalVars[node.left.name] = node.left.name;
                return true;
            }
            if (node.operator === '=') {
                delete scope.nonLocalVars[node.left.name];
            }
            return false;
        }

        var checkIfSecondOrderState = function (node) {
            var funcName = ''
            if (functionStack.length !== 0) {
                var scope = functionStack[functionStack.length - 1];
                funcName = scope.func.id ? scope.func.id : '';
                if (funcName === '' && scope.func.parent.id) {
                    funcName = scope.func.parent.id.name;
                }
            }
            var funcCall = node.callee.name;
            context.report({
                node,
                message: SECOND_ORDER_MSG,
                data: {
                    funcName,
                    funcCall
                }
            });
            return true;
        }
        //--------------------------------------------------------------------------
        // Helpers
        //--------------------------------------------------------------------------


        //--------------------------------------------------------------------------
        // Public
        //--------------------------------------------------------------------------

        return {
            FunctionExpression: pushFunctionToStack,
            FunctionDeclaration: pushFunctionToStack,
            "FunctionExpression:exit": popFunctionFromStack,
            "FunctionDeclaration:exit": popFunctionFromStack,
            CallExpression: checkIfSecondOrderState,
            VariableDeclaration: function (node) {
                if (functionStack.length == 0) {
                    return;
                }
                var scope = functionStack[functionStack.length - 1];
                for (var i = 0; i < node.declarations.length; i++) {
                    //TODO: Need to check that what is being declared is also not a reference
                    if (!isDeclaratorInput(node.declarations[i], scope)) {
                        scope.localVars[node.declarations[i].id.name] = node.declarations[i];
                    }

                }
            },
            AssignmentExpression: function (node) {

                var scope = functionStack[functionStack.length - 1];
                //TODO: need to only check first part of name and only first part if it is an array
                //TODO: if it is a local variable, will need to account for state first and make sure that variable isn't just grabbing a reference to an external variable
                //TODO: need to account for this statement
                isOutput(node, scope);
                isAssignmentInput(node, scope);

            }

        };
        /* TODO
         * TODO: constraint consistency problems for local variable(i.e if a local variable is assigned a state value,
         */
    }
};
