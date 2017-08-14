/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 0.14.0 from webgme on Wed Dec 02 2015 15:06:02 GMT-0600 (CST).
 */

define([
    'text!./metadata.json',
    'plugin/PluginBase',
    'common/util/ejs',
    'C2Core/xmljsonconverter',
    'C2Core/ModelTraverserMixin',
    'DeploymentExporter/Templates/Templates',
    'FederatesExporter/RTIVisitors',
    'FederatesExporter/PubSubVisitors',
], function (
    pluginMetadata,
    PluginBase,
    ejs,
    JSON2XMLConverter,
    ModelTraverserMixin,
    TEMPLATES,
    RTIVisitors,
    PubSubVisitors
) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);
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
        PubSubVisitors.call(this);
        RTIVisitors.call(this);

        this._jsonToXml = new JSON2XMLConverter.Json2xml();
        this.pluginMetadata = pluginMetadata;
    };

    // Prototypal inheritance from PluginBase.
    DeploymentExporter.prototype = Object.create(PluginBase.prototype);
    DeploymentExporter.prototype.constructor = DeploymentExporter;
    DeploymentExporter.metadata = pluginMetadata;
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
            generateFiles,
            numberOfFilesToGenerate,
            finishExport,
            pomModel = {};

        self.fileGenerators = [];
        self.fom_sheets = {};
        self.federates = [];
        self.interactions = {};
        self.interactionRoots = [];
        self.objects = {};
        self.objectRoots = [];
        self.attributes = {};

        // Experiment Related
        self.experimentModelConfig =[[]]
        self.experimentPaths= []


        // COA related
        self.coaNodes = [];
        self.coaEdges = [];
        self.coaPaths = {};

        self.projectName = self.core.getAttribute(self.rootNode, 'name');
        self.bindAddress = self.getCurrentConfig().bindAddress.trim();

        pomModel.projectName = self.projectName;
        pomModel.groupId = self.getCurrentConfig().groupId.trim();
        pomModel.projectVersion = self.getCurrentConfig().exportVersion.trim() + (self.getCurrentConfig().isRelease ? "" : "-SNAPSHOT");
        pomModel.cpswtVersion = self.getCurrentConfig().cpswtVersion;
        pomModel.repositoryUrlSnapshot = self.getCurrentConfig().repositoryUrlSnapshot;
        pomModel.repositoryUrlRelease = self.getCurrentConfig().repositoryUrlRelease;
        pomModel.federates = self.federates;

        pomModel.porticoPOM = {};
        pomModel.porticoPOM.artifactId = "portico";
        pomModel.porticoPOM.groupId = "org.porticoproject";
        pomModel.porticoPOM.version = self.getCurrentConfig().porticoReleaseNum;
        pomModel.porticoPOM.scope = "provided";

        //Add POM generator
        self.fileGenerators.push(function (artifact, callback) {
            pomModel['federatesByType'] = {};
            pomModel.federates.forEach(function (fed) {
                if (!pomModel['federatesByType'][fed.FederateType]) {
                    pomModel['federatesByType'][fed.FederateType] = [];
                }
                pomModel['federatesByType'][fed.FederateType].push(fed);
            });

            artifact.addFile('pom.xml', ejs.render(TEMPLATES['execution_pom.xml.ejs'], pomModel), function (err) {
                if (err) {
                    callback(err);
                    return;
                } else {
                    callback();
                }
            });
        });

        self.fomModel = {
            federationname: self.projectName,
            objects: [],
            interactions: []
        };

        //Add FED generator
        self.fileGenerators.push(function (artifact, callback) {

            var interactionTraverser = function (interaction) {
                var intModel = {
                    interaction: interaction,
                    parameters: interaction.parameters,
                    children: []
                };
                interaction.children.forEach(function (child) {
                    intModel.children.push(interactionTraverser(child));
                });
                return ejs.render(TEMPLATES["fedfile_siminteraction.ejs"], intModel);
            }

            self.fomModel.interactions = [];
            self.interactionRoots[0].children.forEach(function (inta) {
                self.fomModel.interactions.push(interactionTraverser(inta));
            });


            var objectTraverser = function (object) {
                var objModel = {
                    name: object.name,
                    attributes: object.attributes,
                    children: []
                };
                object.children.forEach(function (child) {
                    objModel.children.push(objectTraverser(child));
                });
                return ejs.render(TEMPLATES["fedfile_simobject.ejs"], objModel);
            }

            self.fomModel.objects = [];
            self.objectRoots[0].children.forEach(function (obj) {
                self.fomModel.objects.push(objectTraverser(obj));
            });

            artifact.addFile('fom/' + self.projectName + '.fed', ejs.render(TEMPLATES['fedfile.fed.ejs'], self.fomModel), function (err) {
                if (err) {
                    callback(err);
                    return;
                } else {
                    callback();
                }
            });
        });

        //Add fom.xml generator
        self.fileGenerators.push(function(artifact, callback){
            
            var interactionTraverser = function(interaction){
                var intModel = {
                    interaction:interaction,
                    parameters:interaction.parameters,
                    children:[]
                };
                if(interaction.name === "InteractionRoot" ||interaction.name==="C2WInteractionRoot"){
                    interaction.sharing = "Neither"
                }else{
                    interaction.sharing = "PublishSubscribe"
                }
                if(interaction.delivery==="reliable") {
                    interaction.delivery = "HLAreliable"
                }
                else {
                    interaction.delivery="HLAbestEffort"
                }

                if(interaction.order==="timestamp")
                {
                    interaction.order="TimeStamp"
                }else{
                    interaction.order="Receive"
                }


                interaction.children.forEach(function(child){
                    intModel.children.push(interactionTraverser(child));
                });
                return ejs.render(TEMPLATES["fedfile_siminteraction_xml.ejs"], intModel);
            }

            self.fomModel.interactions_xml = [];
            self.interactionRoots.forEach(function(inta){
                self.fomModel.interactions_xml.push(interactionTraverser(inta));
            });
            

            var objectTraverser_xml = function(object){
                var objModel = {
                    name:object.name,
                    attributes:object.attributes,
                    children:[],
                    sharing:"",
                    semantics:""
                };

                if(object.name === "ObjectRoot" ){
                    objModel.sharing = "Neither"
                }else{
                    objModel.sharing = "PublishSubscribe"
                }
                objModel.attributes.forEach(function(attr){
                    if(attr.delivery==="reliable") {
                        attr.delivery = "HLAreliable"
                    }
                    else {
                        attr.delivery="HLAbestEffort"
                    }

                    if(attr.order==="timestamp")
                    {
                        attr.order="TimeStamp"
                    }else{
                        attr.order="Receive"
                    }
                })


                object.children.forEach(function(child){
                    objModel.children.push(objectTraverser_xml(child));
                });
                return ejs.render(TEMPLATES["fedfile_simobject_xml.ejs"], objModel);
            }

            self.fomModel.objects_xml = [];

            self.objectRoots.forEach(function(obj){
                self.fomModel.objects_xml.push(objectTraverser_xml(obj));
            })



            artifact.addFile('fom/' + self.projectName + '.xml', ejs.render(TEMPLATES['fedfile.xml.ejs'], self.fomModel), function (err) {
                if (err) {
                    callback(err);
                    return;
                }else{
                    callback();
                }
            });

        });

        self.coaConfigModel = {
            'script': {
                'expect': [],
                'pauses': [],
                'coaNodes': [],
                'coaEdges': []
            }
        };

        //Add COACONFIG.JSON
        self.fileGenerators.push(function (artifact, callback) {
            self.federates.forEach(function (fed) {
                //self.coaConfigModel.script.expect.push({'@federateType':fed.name});
                self.coaConfigModel.script.expect.push({
                    'federateType': fed.name
                });
            });
            self.coaConfigModel.script.coaNodes = self.coaNodes;
            self.coaEdges.forEach(function (edge) {
                if (self.coaPaths.hasOwnProperty(edge.fromNode)) {
                    edge.fromNode = self.coaPaths[edge.fromNode];
                } else {
                    edge.fromNode = ""
                }
                if (self.coaPaths.hasOwnProperty(edge.toNode)) {
                    edge.toNode = self.coaPaths[edge.toNode];
                } else {
                    edge.toNode = ""
                }
                self.coaConfigModel.script.coaEdges.push(edge);
            });

            /*artifact.addFile('src/experiments/' + 'default' + '/' + 'script.xml', self._jsonToXml.convertToString( self.coaConfigModel ) , function (err) {
                if (err) {
                    callback(err);
                    return;
                }else{
                    callback();
                }
            });*/
            artifact.addFile('conf/' + 'coaConfig.json', JSON.stringify(self.coaConfigModel, null, 2), function (err) {
                if (err) {
                    callback(err);
                    return;
                } else {
                    callback();
                }
            });
        });

        //////////////////
        // New Experiment Config
        /////////////////
        self.fileGenerators.push(function (artifact, callback) {
            var response = []

            if(self.experimentPaths.length !=0 ){
                self.experimentPaths.forEach(function (objPath) {

                        var experimentmodel = {

                            name: "",
                            exptConfig: {
                                'federateTypesAllowed': [],
                                'expectedFederates': [],
                                'lateJoinerFederates': []

                            }
                        }

                        self.experimentModelConfig[objPath].forEach(function (expSet) {

                            var reference_name = self.core.getAttribute(expSet, "name").split("-")[0];
                            // var expFed = self.federates.filter(function(el){
                            //     return el.name==reference_name
                            // })

                            experimentmodel.name = self.core.getAttribute(self.core.getParent(expSet), "name")
                            experimentmodel.exptConfig.federateTypesAllowed.push(reference_name)
                            if (!self.core.getAttribute(expSet, "isLateJoiner")) {
                                experimentmodel.exptConfig.expectedFederates.push({
                                    "federateType": reference_name,
                                    "count": self.core.getAttribute(expSet, "count")
                                })
                            }
                            else {
                                experimentmodel.exptConfig.lateJoinerFederates.push({
                                    "federateType": reference_name,
                                    "count": self.core.getAttribute(expSet, "count")
                                })
                            }

                        })

                        artifact.addFile('conf/' + experimentmodel.name.toLowerCase() + '.json', JSON.stringify(experimentmodel.exptConfig, null, 2), function (err) {
                            response.push(err)
                            if (response.length == self.experimentPaths.length) {
                                if (response.includes(err)) {
                                    callback(err);
                                } else {
                                    callback();
                                }
                            }
                        });
                    }
                )

            }
            else {
                callback();
            }

        });

        self.experimentModel = {
            'script': {
                'federateTypesAllowed': [],
                'expectedFederates': [],
                'lateJoinerFederates': []
            }
        };

        //Add default RID file
        self.fileGenerators.push(function(artifact, callback){
           artifact.addFile('RTI.rid', ejs.render(TEMPLATES['rti.rid.ejs'], self) , function (err) {
                if (err) {
                    callback(err);
                    return;
                }else{
                    callback();
                }
            });
        });

            //Add impl log config from template
        self.fileGenerators.push(function (artifact, callback) {
        var java_implLog = {};
        java_implLog.projectName = self.projectName;
                artifact.addFile('conf/' + 'log4j2.xml', ejs.render(TEMPLATES['log4j2.xml.ejs'], self), function (err) {
                if (err) {
                    callback(err);
                    return;
                } else {
                    callback();
                }
            });
        });

        // Experiment Config    
        self.fileGenerators.push(function (artifact, callback) {
            self.federates.forEach(function (fed) {
                self.experimentModel.script.federateTypesAllowed.push(fed.name)
                self.experimentModel.script.expectedFederates.push({
                    "federateType": fed.name,
                    "count": 0
                });
                self.experimentModel.script.lateJoinerFederates.push({
                    "federateType": fed.name,
                    "count": 1
                });
            });
            artifact.addFile('conf/' + 'experimentConfig.json', JSON.stringify(self.experimentModel.script, null, 2), function (err) {
                if (err) {
                    callback(err);
                    return;
                } else {
                    callback();
                }
            });
        });

        // Federate Config JSON
        self.fileGenerators.push(function (artifact, callback) {

            var FederateJsonModel = {
                "federateRTIInitWaitTimeMs": 200,
                "federateType": "",
                "federationId": "FedManager",
                "isLateJoiner": true,
                "lookAhead": 0.1,
                "stepSize": 1.0
            }
            var response = []
            self.federates.forEach(function (fed) {
                FederateJsonModel.lookAhead = fed.Lookahead;
                FederateJsonModel.stepSize = fed.Step;
                FederateJsonModel.federateType = fed.name;
                artifact.addFile('conf/' + fed.name.toLowerCase() + '.json', JSON.stringify(FederateJsonModel, null, 2), function (err) {
                    response.push(err)
                    if (response.length == self.federates.length) {
                        if (response.includes(err)) {
                            callback(err);
                        } else {
                            callback();
                        }
                    }
                });
            });
        });

        // Add fedmgrconfig.json 
        self.fileGenerators.push(function (artifact, callback) {
            var fedmgrConfig = {
                'script': {
                    "federateRTIInitWaitTimeMs": 200,
                    "federateType": "FederationManager",
                    "federationId": "FedManager",
                    "isLateJoiner": true,
                    "lookAhead": 0.1,
                    "stepSize": 1.0,

                    "bindHost": "0.0.0.0",
                    "port": 8083,
                    "controlEndpoint": "/fedmgr",
                    "federatesEndpoint": "/federates",

                    "federationEndTime": 0.0,
                    "realTimeMode": true,
                    "terminateOnCOAFinish": false,
                    "fedFile": "fom/" +self.projectName + '.fed',
                    "experimentConfig": "conf/experimentConfig.json"
                }
            };
            
            artifact.addFile('conf/fedmgrconfig.json', JSON.stringify(fedmgrConfig.script, null, 2), function (err) {
                if (err) {
                    callback(err);
                    return;
                } else {
                    callback();
                }
            });
        });

        generateFiles = function (artifact, doneBack) {
            if (numberOfFilesToGenerate > 0) {
                self.fileGenerators[self.fileGenerators.length - numberOfFilesToGenerate](artifact, function (err) {
                    if (err) {
                        callback(err, self.result);
                        return;
                    }
                    numberOfFilesToGenerate--;
                    if (numberOfFilesToGenerate > 0) {

                        generateFiles(artifact, doneBack);
                    } else {
                        doneBack();
                    }
                });
            } else {
                doneBack();
            }
        }

        finishExport = function (err) {

            //var outFileName = self.projectName + '.json'
            var artifact = self.blobClient.createArtifact(self.projectName.trim().replace(/\s+/g, '_') + '_deployment');

            numberOfFilesToGenerate = self.fileGenerators.length;
            if (numberOfFilesToGenerate > 0) {
                generateFiles(artifact, function (err) {
                    if (err) {
                        callback(err, self.result);
                        return;
                    }

                    self.blobClient.saveAllArtifacts(function (err, hashes) {
                        if (err) {
                            callback(err, self.result);
                            return;
                        }

                        // This will add a download hyperlink in the result-dialog.
                        for (var idx = 0; idx < hashes.length; idx++) {
                            self.result.addArtifact(hashes[idx]);

                            var artifactMsg = 'Deployment package ' + self.blobClient.artifacts[idx].name + ' was generated with id:[' + hashes[idx] + ']';
                            var buildURL = "'http://c2w-cdi.isis.vanderbilt.edu:8080/job/c2w-pull/buildWithParameters?GME_ARTIFACT_ID=" + hashes[idx] + "'"
                            artifactMsg += '<br><a title="Build package..." ' +
                                'onclick="window.open(' + buildURL + ', \'Build System\'); return false;">Build artifact..</a>';
                            self.createMessage(null, artifactMsg);

                        };


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
                    });
                })

            } else {
                self.result.setSuccess(true);
                callback(null, self.result);
            }

        }

        self.visitAllChildrenFromRootContainer(self.rootNode, function (err) {
            if (err)
                self.logger.error(err);
            else
                finishExport(err);
        });

    };


    DeploymentExporter.prototype.visit_FederateExecution = function (node, parent, context){

        var self = this;

        if(self.experimentPaths.indexOf(self.core.getPath(parent)) === -1){
            self.experimentPaths.push(self.core.getPath(parent))
        }
        self.experimentModelConfig[self.core.getPath(parent)] = self.experimentModelConfig[self.core.getPath(parent)] || []
        self.experimentModelConfig[self.core.getPath(parent)].push(node)

        return {
            context: context
        };

    }


    ////////////////////////
    // COA node visitors
    ///////////////////////

    DeploymentExporter.prototype.addCoaNode = function (node, obj) {
        var self = this;

        obj.name = self.core.getAttribute(node, 'name');
        obj.nodeType = self.core.getAttribute(self.getMetaType(node), 'name');
        obj.ID = self.core.getGuid(node);

        self.coaNodes.push(obj);
        self.coaPaths[self.core.getPath(node)] = self.core.getGuid(node);
    };

    DeploymentExporter.prototype.visit_Action = function (node, parent, context) {
        var self = this,
            interactionName = '',
            obj = {},
            paramValues = self.core.getAttribute(node, 'ParamValues');

        paramValues.split(" ").forEach(function (param) {
            try {
                obj[param.split('=')[0]] = param.split('=')[1].split('"')[1]
            } catch (err) {
                self.logger.debug('Erroneous param ' + param);
            }
        });

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_Fork = function (node, parent, context) {
        var self = this,
            obj = {
                isDecisionPoint: self.core.getAttribute(node, 'isDecisionPoint')
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_ProbabilisticChoice = function (node, parent, context) {
        var self = this,
            obj = {
                isDecisionPoint: self.core.getAttribute(node, 'isDecisionPoint')
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_SyncPoint = function (node, parent, context) {
        var self = this,
            obj = {
                time: self.core.getAttribute(node, 'time'),
                minBranchesToSync: self.core.getAttribute(node, 'minBranchesToSync')
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_Dur = function (node, parent, context) {
        var self = this,
            obj = {
                time: self.core.getAttribute(node, 'time')
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_RandomDur = function (node, parent, context) {
        var self = this,
            obj = {
                lowerBound: self.core.getAttribute(node, 'lowerBound'),
                upperBound: self.core.getAttribute(node, 'upperBound')
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_AwaitN = function (node, parent, context) {
        var self = this,
            obj = {
                minBranchesToAwait: self.core.getAttribute(node, 'minBranchesToAwait')
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_Outcome = function (node, parent, context) {
        var self = this,
            obj = {
                interactionName: ""
            };

        self.addCoaNode(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_OutcomeFilter = function (node, parent, context) {
        var self = this;

        self.addCoaNode(node, {});
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_TerminateCOA = function (node, parent, context) {
        var self = this;

        self.addCoaNode(node, {});
        return {
            context: context
        };
    };




    DeploymentExporter.prototype.addCoaEdge = function (node, obj) {
        var self = this;

        obj.name = self.core.getAttribute(node, 'name');
        obj.type = self.core.getAttribute(self.getMetaType(node), 'name');
        obj.ID = self.core.getGuid(node);
        obj.flowID = self.core.getAttribute(node, 'flowID');
        obj.fromNode = self.core.getPointerPath(node, 'src');
        obj.toNode = self.core.getPointerPath(node, 'dst');

        self.coaEdges.push(obj);
    };

    DeploymentExporter.prototype.visit_COAFlow = function (node, parent, context) {
        var self = this;

        self.addCoaEdge(node, {});
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_COAFlowWithProbability = function (node, parent, context) {
        var self = this,
            obj = {
                probability: self.core.getAttribute(node, 'probability')
            };

        self.addCoaEdge(node, obj);
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_Outcome2Filter = function (node, parent, context) {
        var self = this;

        self.addCoaEdge(node, {});
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_Filter2COAElement = function (node, parent, context) {
        var self = this;

        self.addCoaEdge(node, {});
        return {
            context: context
        };
    };

    DeploymentExporter.prototype.visit_COAException = function (node, parent, context) {
        var self = this;

        self.addCoaEdge(node, {});
        return {
            context: context
        };
    };

    ////////////////////////
    // END COA node visitors
    ///////////////////////

    DeploymentExporter.prototype.visit_Federate = function (node, parent, context) {
        var self = this,
            ret = {
                context: context
            },
            nodeType = self.core.getAttribute(self.getMetaType(node), 'name'),
            fed = {
                name: self.core.getAttribute(node, 'name')
            },
            nodeAttrNames;
        self.logger.info('Visiting a Federate');

        nodeAttrNames = self.core.getAttributeNames(node);
        for (var i = 0; i < nodeAttrNames.length; i += 1) {
            fed[nodeAttrNames[i]] = self.core.getAttribute(node, nodeAttrNames[i]);
        }
        fed.FederateType = nodeType;
        fed.configFile = "conf/" + fed.name.toLowerCase() + ".json";
        self.federates.push(fed);

        if (nodeType != 'Federate') {
            try {
                ret = self['visit_' + nodeType](node, parent, context);
            } catch (err) {
                self.logger.debug('No visitor function for ' + nodeType);
            }
        }

        return ret;
    };

    DeploymentExporter.prototype.getVisitorFuncName = function (nodeType) {
        var self = this,
            visitorName = 'generalVisitor';
        if (nodeType) {
            visitorName = 'visit_' + nodeType;
            if (nodeType.endsWith('Federate')) {
                visitorName = 'visit_' + 'Federate';
            }

        }
        //self.logger.debug('Genarated visitor Name: ' + visitorName);
        return visitorName;
    }

    DeploymentExporter.prototype.getPostVisitorFuncName = function (nodeType) {
        var self = this,
            visitorName = 'generalPostVisitor';
        if (nodeType) {
            visitorName = 'post_visit_' + nodeType;
            if (nodeType.endsWith('Federate')) {
                visitorName = 'post_visit_' + 'Federate';
            }
        }
        //self.logger.debug('Genarated post-visitor Name: ' + visitorName);
        return visitorName;

    }

    DeploymentExporter.prototype.getChildSorterFunc = function (nodeType, self) {
        var self = this,
            visitorName = 'generalChildSorter';

        var generalChildSorter = function (a, b) {

            //a is less than b by some ordering criterion : return -1;
            //a is greater than b by the ordering criterion: return 1;
            // a equal to b, than return 0;
            var aName = self.core.getAttribute(a, 'name');
            var bName = self.core.getAttribute(b, 'name');
            if (aName < bName) return -1;
            if (aName > bName) return 1;
            return 0;

        };
        return generalChildSorter;

    }

    DeploymentExporter.prototype.excludeFromVisit = function (node) {
        var self = this,
            exclude = false;

        //exclude = exclude || self.isMetaTypeOf(node, self.META['Language [CASIM]']) || self.isMetaTypeOf(node, self.META['Language [C2WT]']);
        exclude = exclude || self.isMetaTypeOf(node, self.META['Language [C2WT]']);

        return exclude;

    }

    /*
     * Rest of TRAVERSAL CODE:
     * - PubSubVisitors.js
     * - RTIVisitors.js
     * - C2Federates folder for Federate specific vistors
     */

    DeploymentExporter.prototype.ROOT_visitor = function (node) {
        var self = this;
        self.logger.info('Visiting the ROOT');

        var root = {
            "@id": 'model:' + '/root',
            "@type": "gme:root",
            "model:name": self.projectName,
            "gme:children": []
        };

        return {
            context: {
                parent: root
            }
        };
    }


    DeploymentExporter.prototype.calculateParentPath = function (path) {
        if (!path) {
            return null;
        }
        var pathElements = path.split('/');
        pathElements.pop();
        return pathElements.join('/');
    }

    return DeploymentExporter;
});
