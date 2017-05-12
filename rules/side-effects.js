/**
 * @fileoverview Rule to enforce a single linebreak style.
 * @author Erik Mueller
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
        const EXPECTED_LF_MSG = "Expected linebreaks to be 'LF' but found 'CRLF'.",
            EXPECTED_CRLF_MSG = "Expected linebreaks to be 'CRLF' but found 'LF'.";

        const sourceCode = context.getSourceCode();

        var pushFunctionToStack = function(node){
            functionStack.push({func: node, localVars: {}, excludes: {}});
        }

        var popFunctionFromStack = function(node){
            functionStack.pop();
        }

        var checkForSideEffects = function(node, scope) {
            if(!scope.localVars.hasOwnProperty(node.left.name.split('.')[0]) || Object.keys(node.excludes).some(function(k){ return ~k.startsWith(node.left.name) })){
                var name = node.left.name;
                var funcName = scope.func.id ? scope.func.id : '';
                if(funcName === '' && scope.func.parent.id){
                    funcName = scope.func.parent.id.name;
                }
                var lineNum = node.loc.start.line;
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
        var checkForStateDeclarator = function(node,scope){
            if(!!node.init.name && !scope.localVars.hasOwnProperty(node.init.name.split('.')[0])) {
                var name = node.init.name;
                var funcName = scope.func.id ? scope.func.id : '';
                if(funcName === '' && scope.func.parent.id){
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
                return true;
            }
            return false;
        }
        var checkForStateAssignment = function(node, scope){
            if(!!node.right.name && !scope.localVars.hasOwnProperty(node.right.name.split('.')[0])){
                var name = node.right.name;
                var funcName = scope.func.id ? scope.func.id : '';
                if(funcName === '' && scope.func.parent.id){
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
                return true;
            }
            return false;
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
            VariableDeclaration: function(node) {
                if(functionStack.length == 0){
                    return;
                }
                var scope = functionStack[functionStack.length-1];
                for(var i = 0; i < node.declarations.length; i++){
                    //TODO: Need to check that what is being declared is also not a reference
                    if(!checkForStateDeclarator(node.declarations[i], scope)){
                        scope.localVars[node.declarations[i].id.name] = node.declarations[i];
                    }

                }
            },
            AssignmentExpression: function(node) {

                var scope = functionStack[functionStack.length-1];
                //TODO: need to only check first part of name and only first part if it is an array
                //TODO: if it is a local variable, will need to account for state first and make sure that variable isn't just grabbing a reference to an external variable
                //TODO: need to account for this statement
                checkForSideEffects(node, scope);
                checkForStateAssignment(node, scope);

            }

        };
    }
};
