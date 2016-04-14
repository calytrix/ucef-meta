/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 0.14.0 from webgme on Wed Dec 02 2015 15:05:52 GMT-0600 (CST).
 */

define([
    'plugin/PluginConfig',
    'plugin/PluginBase',
    'common/util/ejs',
    'C2Core/ModelTraverserMixin',
    'C2Core/xmljsonconverter',
    'C2Core/MavenPOM',
    'FederatesExporter/PubSubVisitors',
    'FederatesExporter/RTIVisitors',
    'C2Federates/Templates/Templates',
    'C2Federates/GenericFederate',
    'C2Federates/JavaFederate',
    'C2Federates/MapperFederate',
    'C2Federates/CppFederate',
    'C2Federates/OmnetFederate',
    'C2Federates/CPNFederate'
], function (
    PluginConfig,
    PluginBase,
    ejs,
    ModelTraverserMixin,
    JSON2XMLConverter,
    MavenPOM,
    PubSubVisitors,
    RTIVisitors,
    TEMPLATES,
    GenericFederate,
    JavaFederate,
    MapperFederate,
    CppFederate,
    OmnetFederate,
    CPNFederate
    ) {
    'use strict';

    /**
     * Initializes a new instance of FederatesExporter.
     * @class
     * @augments {PluginBase}typ
     * @classdesc This class represents the plugin FederatesExporter.
     * @constructor
     */
    var FederatesExporter = function () {
        // Call base class' constructor.

        this.federateTypes = this.federateTypes || {};  

        PluginBase.call(this);
        ModelTraverserMixin.call(this);
        PubSubVisitors.call(this);
        RTIVisitors.call(this);
        GenericFederate.call(this);
        JavaFederate.call(this);
        MapperFederate.call(this);
        CppFederate.call(this);
        OmnetFederate.call(this);
        CPNFederate.call(this);

        this.mainPom = new MavenPOM();
        this._jsonToXml = new JSON2XMLConverter.Json2xml();
    };

    // Prototypal inheritance from PluginBase.
    FederatesExporter.prototype = Object.create(PluginBase.prototype);
    FederatesExporter.prototype.constructor = FederatesExporter;

    /**
     * Gets the name of the FederatesExporter.
     * @returns {string} The name of the plugin.
     * @public
     */
    FederatesExporter.prototype.getName = function () {
        return 'FederatesExporter';
    };

    /**
     * Gets the semantic version (semver.org) of the FederatesExporter.
     * @returns {string} The version of the plugin.
     * @public
     */
    FederatesExporter.prototype.getVersion = function () {
        return '0.1.0';
    };

    /**
     * Gets the configuration structure for the FederatesExporter.
     * The ConfigurationStructure defines the configuration for the plugin
     * and will be used to populate the GUI when invoking the plugin from webGME.
     * @returns {object} The version of the plugin.
     * @public
     */
    FederatesExporter.prototype.getConfigStructure = function () {
        var baseURLDefault = 'https://editor.webgme.org',
            usernameDefault = 'guest',
            allFederateTypes = '';

        if(window){
            baseURLDefault = window.location.protocol + window.location.pathname + window.location.pathname + window.location.host;
        }

        if(WebGMEGlobal && WebGMEGlobal.Client){
            usernameDefault =WebGMEGlobal.userInfo._id;
        }

        if(this.federateTypes){
            for(var typeKey in this.federateTypes){
                allFederateTypes+=typeKey + ' '
            }
            allFederateTypes.trim();
        }

        return [
            {
                name: 'exportVersion',
                displayName: 'version',
                description: 'The version of the model to be exported',
                value: '0.0.1',
                valueType: 'string',
                readOnly: false
            },{
                name: 'isRelease',
                displayName: 'release',
                description: 'Is the model a release version?   ',
                value: false,
                valueType: 'boolean',
                readOnly: false
            },{
                name: 'groupId',
                displayName: 'Maven GroupID',
                description: 'The group ID to be included in the Maven POMs',
                value: 'org.webgme.' + usernameDefault,
                valueType: 'string',
                readOnly: false
            },{
                name: 'c2wVersion',
                displayName: 'C2W version',
                description: 'The version of the C2W foundation to be used',
                value: '0.0.1-SNAPSHOT',
                valueType: 'string',
                readOnly: false
            },{
                name: 'repositoryUrlSnapshot',
                displayName: 'Repository URL for snapshots',
                description: 'The URL of the repository where the packaged components should be deployed.',
                value: 'http://c2w-cdi.isis.vanderbilt.edu:8088/repository/snapshots/',
                valueType: 'string',
                readOnly: false
            },{
                name: 'repositoryUrlRelease',
                displayName: 'Repository URL for releases',
                description: 'The URL of the repository where the packaged components should be deployed.',
                value: 'http://c2w-cdi.isis.vanderbilt.edu:8088/repository/internal/',
                valueType: 'string',
                readOnly: false
            },{
                name: 'generateExportPackages',
                displayName: 'Generate exports packages',
                description: 'Generate the packages marked as export?   ',
                value: false,
                valueType: 'boolean',
                readOnly: false
            /*},{
                name: 'projectNameTemplate',
                displayName: 'Project Name Template',
                description: 'EJS Template for naming the maven projects',
                value: '<%=federation_name%><%=artifact_name?"-"+artifact_name:""%><%=language?"-"+language:""%>',
                valueType: 'string',
                readOnly: true*/        
            },{
                name: 'includedFederateTypes',
                displayName: 'include',
                description: 'The Types of federates included in this export',
                value: allFederateTypes,
                valueType: 'string',
                readOnly: true
            
                    
            /*},{
                name: 'urlBase',
                displayName: 'URL Base',
                description: 'The base address of webGME where the model is accessible',
                value: baseURLDefault,
                valueType: 'string',
                readOnly: false*/
            }
        ];
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
    FederatesExporter.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this,
            numberOfFilesToGenerate,
            finishExport,
            generateFiles,
            saveAndReturn;

        self.fileGenerators = [];
        self.corefileGenerators = [];

        self.fom_sheets = {};
        self.interactions = {};
        self.interactionRoots = [];
        self.objects      = {};
        self.objectRoots = [];
        self.attributes   = {};
        self.federates = {};

        self.fedFilterMap = {};
        self.fedFilterMap["MAPPER_FEDERATES"] = "MAPPER";
        self.fedFilterMap["NON-MAPPER_FEDERATES"] = "NON_MAPPER";
        self.fedFilterMap["BOTH"] = "ORIGIN_FILTER_DISABLED";
        self.fedFilterMap["SELF"] = "SELF";
        self.fedFilterMap["NON-SELF"] = "NON_SELF";

        self.projectName = self.core.getAttribute(self.rootNode, 'name');
        self.project_version = self.getCurrentConfig().exportVersion.trim() + (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
        self.c2w_version = self.getCurrentConfig().c2wVersion.trim();
        //self.directoryNameTemplate = self.getCurrentConfig().projectNameTemplate.trim();
        self.directoryNameTemplate= '<%=federation_name%><%=artifact_name?"-"+artifact_name:""%><%=language?"-"+language:""%>';
        self.generateExportPackages = self.getCurrentConfig().generateExportPackages;

        self.mainPom.artifactId = self.projectName + "_root";
        self.mainPom.version = self.project_version;
        self.mainPom.packaging = "pom";
        self.mainPom.groupId = self.getCurrentConfig().groupId.trim();
        self.mainPom.addRepository({
            'id': 'archiva.internal',
            'name': 'Internal Release Repository',
            'url': self.getCurrentConfig().repositoryUrlRelease.trim()
        });
        
        self.mainPom.addSnapshotRepository({
            'id': 'archiva.snapshots',
            'name': 'Internal Snapshot Repository',
            'url': self.getCurrentConfig().repositoryUrlSnapshot.trim()
        });

        self.getCurrentConfig().includedFederateTypes.trim().split(" ").forEach(function(e){
            if(self.federateTypes.hasOwnProperty(e)){
                self.federateTypes[e].includeInExport = true;
                if(self.federateTypes[e].hasOwnProperty('init')){
                   self.federateTypes[e].init.call(self); 
                }
            }
        });

        // Using the logger.
        //self.logger.debug('This is a debug message.');
        //self.logger.info('This is an info message.');
        //self.logger.warn('This is a warning message.');
        //self.logger.error('This is an error message.');

        //Add POM generator
        self.fileGenerators.push(function(artifact, callback){
            artifact.addFile('pom.xml', self._jsonToXml.convertToString( self.mainPom.toJSON() ), function (err) {
                if (err) {
                    callback(err);
                    return;
                }else{
                    callback();
                }
            });
        });

        

        generateFiles = function(artifact, fileGerenrators, doneBack){
            if(numberOfFilesToGenerate > 0){ 
                fileGerenrators[fileGerenrators.length - numberOfFilesToGenerate](artifact, function(err){
                    if (err) {
                        callback(err, self.result);
                        return;
                    }
                    numberOfFilesToGenerate--;
                    if(numberOfFilesToGenerate > 0){

                        generateFiles(artifact, fileGerenrators, doneBack);
                    }else{
                        doneBack();
                     }
                });                
            }else{
                doneBack();
            }
        }

        saveAndReturn = function(err){
            var errorRaised = false;
            for(var i = 0; i < self.result.getMessages().length; i++){
                var msg = self.result.getMessages()[i];
                if(msg.severity == 'error'){
                    errorRaised = true;
                }
            }
            if(!errorRaised){
                self.blobClient.saveAllArtifacts(function (err, hashes) {
                    if (err) {
                        callback(err, self.result);
                        return;
                    }

                    
                    //self.createMessage(null, 'Code artifact generated with id:[' + hashes[0] + ']');
                    
                    // This will add a download hyperlink in the result-dialog.
                    for (var idx = 0; idx < hashes.length; idx++) {
                        self.result.addArtifact(hashes[idx]);

                        var artifactMsg = 'Code package ' + self.blobClient.artifacts[idx].name + ' was generated with id:[' + hashes[idx] + ']';
                        var buildURL = "'http://c2w-cdi.isis.vanderbilt.edu:8080/job/c2w-pull/buildWithParameters?GME_ARTIFACT_ID="+hashes[idx]+"'"
                        artifactMsg += '<br><a title="Build package..." '+
                                'onclick="window.open(' + buildURL + ', \'Build System\'); return false;">Build artifact..</a>';
                        self.createMessage(null, artifactMsg );

                    };
                    
                    // This will save the changes. If you don't want to save;
                    // exclude self.save and call callback directly from this scope.
                    self.save('FederatesExporter updated model.', function (err) {
                        if (err) {
                            callback(err, self.result);
                            return;
                        }
                        self.result.setSuccess(true);
                        callback(null, self.result);
                        return;
                    });
                });
            }else{
                self.result.setSuccess(false);
                callback(null, self.result);
                return;
            }
        }

        finishExport = function(err){

            //var outFileName = self.projectName + '.json'
            var artifact = self.blobClient.createArtifact('generated_' +self.projectName.trim().replace(/\s+/g,'_') +'_Files');
            if(self.generateExportPackages){
                var coreArtifact = self.blobClient.createArtifact('generated_Core_Files');
            }

            numberOfFilesToGenerate = self.fileGenerators.length;
            if(numberOfFilesToGenerate > 0){
                generateFiles(artifact, self.fileGenerators, function(err){
                    if (err) {
                        callback(err, self.result);
                        return;
                    }

                    numberOfFilesToGenerate = self.corefileGenerators.length;
                    if(self.generateExportPackages && numberOfFilesToGenerate > 0){
                        generateFiles(coreArtifact, self.corefileGenerators, function(err){
                            if (err) {
                                callback(err, self.result);
                                return;
                            }
                            saveAndReturn();
                            return;
                        });
                    }else{
                        saveAndReturn();
                        return;
                    } 
                });
            }else{
                self.result.setSuccess(true);
                callback(null, self.result);
            }
            
        }

        self.visitAllChildrenFromRootContainer(self.rootNode, function(err){
            if(err){
                self.logger.error(err);
                self.createMessage(null, err, 'error');
                self.result.setSuccess(false);
                callback(null, self.result);
            }else{
                finishExport(err);
            }
        });

    };

    FederatesExporter.prototype.getChildSorterFunc = function(nodeType, self){
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

    FederatesExporter.prototype.excludeFromVisit = function(node){
        var self = this,
            exclude = false;

        if(self.rootNode != node){    
            var nodeTypeName = self.core.getAttribute(self.getMetaType(node),'name');
            exclude = exclude 
            || self.isMetaTypeOf(node, self.META['Language [CASIM]'])
            || self.isMetaTypeOf(node, self.META['Language [C2WT]'])
            || (self.federateTypes.hasOwnProperty(nodeTypeName) && !self.federateTypes[nodeTypeName].includeInExport);
        }
        if(exclude){
            //self.logger.debug("node " + self.core.getAttribute(node, 'name') + "(" + self.core.getPath(node) + ") is excluded from the visit" );
        }
        
        return exclude;
    }

    FederatesExporter.prototype.getVisitorFuncName = function(nodeType){
        var self = this,
            visitorName = 'generalVisitor';
        if(nodeType){
            visitorName = 'visit_'+ nodeType;
            if(nodeType.endsWith('Federate')){
                visitorName = 'visit_'+ 'Federate';
            }
            
        }
        //self.logger.debug('Genarated visitor Name: ' + visitorName);
        return visitorName;   
    }

    FederatesExporter.prototype.getPostVisitorFuncName = function(nodeType){
        var self = this,
            visitorName = 'generalPostVisitor';
        if(nodeType){
            visitorName = 'post_visit_'+ nodeType;
            if(nodeType.endsWith('Federate')){
                visitorName = 'post_visit_'+ 'Federate';
            }
        }
        //self.logger.debug('Genarated post-visitor Name: ' + visitorName);
        return visitorName;
        
    }

    /*
    * Rest of TRAVERSAL CODE:
    * - PubSubVisitors.js
    * - RTIVisitors.js
    * - C2Federates folder for Federate specific vistors
    */

    FederatesExporter.prototype.ROOT_visitor = function(node){
        var self = this;
        self.logger.info('Visiting the ROOT');

        var root = {
            "@id": 'model:' + '/root',
            "@type": "gme:root",
            "model:name": self.projectName,
            "gme:children": []
        };

        return {context:{parent: root}};
    }
    

    FederatesExporter.prototype.calculateParentPath = function(path){
        if(!path){
            return null;
        }
        var pathElements = path.split('/');
        pathElements.pop();
        return pathElements.join('/');
    }

    return FederatesExporter;
});