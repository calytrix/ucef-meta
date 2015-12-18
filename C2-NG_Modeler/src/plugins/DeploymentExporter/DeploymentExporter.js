/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 0.14.0 from webgme on Wed Dec 02 2015 15:06:02 GMT-0600 (CST).
 */

define([
    'plugin/PluginConfig',
    'plugin/PluginBase',
    'C2Core/ModelTraverserMixin'
], function (
    PluginConfig,
    PluginBase,
    ModelTraverserMixin) {
    'use strict';

    /**
     * Initializes a new instance of DeploymentExporter.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin DeploymentExporter.
     * @constructor
     */
    var DeploymentExporter = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        ModelTraverserMixin.call(this);
    };

    // Prototypal inheritance from PluginBase.
    DeploymentExporter.prototype = Object.create(PluginBase.prototype);
    DeploymentExporter.prototype.constructor = DeploymentExporter;

    /**
     * Gets the name of the DeploymentExporter.
     * @returns {string} The name of the plugin.
     * @public
     */
    DeploymentExporter.prototype.getName = function () {
        return 'DeploymentExporter';
    };

    /**
     * Gets the semantic version (semver.org) of the DeploymentExporter.
     * @returns {string} The version of the plugin.
     * @public
     */
    DeploymentExporter.prototype.getVersion = function () {
        return '0.1.0';
    };

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    DeploymentExporter.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            finishExport;


        // Using the logger.
        //self.logger.debug('This is a debug message.');
        //self.logger.info('This is an info message.');
        //self.logger.warn('This is a warning message.');
        s//elf.logger.error('This is an error message.');

        // Using the coreAPI to make changes.

        finishExport = function(){

            // This will save the changes. If you don't want to save;
            // exclude self.save and call callback directly from this scope.
            self.save('DeploymentExporter updated model.', function (err) {
                if (err) {
                    callback(err, self.result);
                    return;
                }
                self.result.setSuccess(true);
                callback(null, self.result);
            });
        }

        self.visitAllChildrenFromRootContainer(self.rootNode, function(err){
            if(err)
                self.logger.error(err);
            else
                finishExport(err);
        });

    };

    DeploymentExporter.prototype.getChildSorterFunc = function(nodeType, self){
        var self = this,
            visitorName = 'generalChildSorter';

        var generalChildSorter = function(a, b) {

            //a is less than b by some ordering criterion : return -1;
            //if(self.isMetaTypeOf(a, self.META['Types'])){
            //    return -1;
            //}
            //a is greater than b by the ordering criterion: return 1;
            //if(self.isMetaTypeOf(b, self.META['Types'])){
            //    return 1;
            //}

            // a equal to b:
            return 0;
        };
        return generalChildSorter;
        
    }

    DeploymentExporter.prototype.excludeFromVisit = function(node){
        var self = this,
            exclude = false;

        exclude = exclude || self.isMetaTypeOf(node, self.META['Language [CASIM]']);
        return exclude;

    }

    return DeploymentExporter;
});