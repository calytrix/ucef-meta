define([
    'common/util/ejs',
    'C2Core/MavenPOM',
	'C2Federates/Templates/Templates',
    'C2Federates/CppRTI'
], function (
    ejs,
    MavenPOM,
	TEMPLATES,
    CppRTI
) {

    'use strict';

    var OmnetFederateExporter  = function () {
    	var self = this,
            omnetOutFilePath,
            omnetDirSpec;
        CppRTI.call(this);

        this.federateTypes = this.federateTypes || {};
    	this.federateTypes['OmnetFederate'] = {
    		includeInExport: false,
    		longName: 'OmnetFederate',
            init: function(){
                self.initCppRTI();

                var omnetDirBasePath = 'cpp-federates/';
                omnetDirSpec = {federation_name: self.projectName, artifact_name: "omnet", language:"cpp"};
                var omnetDirPath =  omnetDirBasePath + ejs.render(self.directoryNameTemplate, omnetDirSpec);
                omnetOutFilePath = omnetDirPath;

                self.omnet_federateBasePOM = new MavenPOM();
                self.omnet_federateBasePOM.groupId = 'org.c2w'
                self.omnet_federateBasePOM.artifactId = 'OmnetFederate';
                self.omnet_federateBasePOM.version = self.c2w_version;   
                self.omnet_federateBasePOM.packaging = "nar";

                self.omnet_basePOM = null; //will be set by model visitor
                //Add base POM generator
                self.fileGenerators.push(function(artifact, callback){
                    if(!self.omnet_basePOM){
                        callback();
                        return;
                    }

                    artifact.addFile(omnetDirPath + '/pom.xml', self._jsonToXml.convertToString( self.omnet_basePOM.toJSON() ), function (err) {
                        if (err) {
                            callback(err);
                            return;
                        }else{
                            callback();
                            return;
                        }
                    });
                });

            }
    	};

    	this.visit_OmnetFederate = function(node, parent, context){
            var self = this,
                nodeType = self.core.getAttribute( self.getMetaType( node ), 'name' );

            self.logger.info('Visiting a OmnetFederate');
            
            //Setup project POM files on visiting the first Mapper Federate
            if(!self.cppPOM){
                self.cppPOM = new MavenPOM(self.mainPom);
                self.cppPOM.artifactId = self.projectName + "-cpp";
                self.cppPOM.directory = "cpp-federates";
                self.cppPOM.version = self.project_version;
                self.cppPOM.packaging = "pom";
                self.cppPOM.name = self.projectName + ' C++ root'
            }

            if(!self.omnet_basePOM){
                self.omnet_basePOM = new MavenPOM(self.cppPOM);
                self.omnet_basePOM.artifactId = ejs.render(self.directoryNameTemplate, omnetDirSpec);
                self.omnet_basePOM.version = self.project_version;
                self.omnet_basePOM.packaging = "nar";
                self.omnet_basePOM.dependencies.push(self.cpp_rtiPOM);
                self.omnet_basePOM.dependencies.push(self.omnet_federateBasePOM);
            }
            
            context['omnetfedspec'] = self.createOmnetFederateCodeModel();
            context['omnetfedspec']['classname'] = self.core.getAttribute(node, 'name');
            context['omnetfedspec']['simname'] = self.projectName;
            context['omnetfedspec']['projectname'] = self.projectName;
            context['omnetfedspec']['timeconstrained'] = self.core.getAttribute(node, 'TimeConstrained');
            context['omnetfedspec']['timeregulating'] = self.core.getAttribute(node, 'TimeRegulating');
            context['omnetfedspec']['lookahead'] = self.core.getAttribute(node, 'Lookahead');
            context['omnetfedspec']['asynchronousdelivery'] = self.core.getAttribute(node, 'EnableROAsynchronousDelivery');

            self.federates[self.core.getPath(node)] = context['omnetfedspec'];

            return {context:context};
        };

        this.post_visit_OmnetFederate = function(node, context){
            var self = this,
                renderContext = context['omnetfedspec'],
                outFileName = omnetOutFilePath + MavenPOM.mavenCppPath + "/" + self.core.getAttribute(node, 'name') + "FilterInit.cpp";
            
            self.fileGenerators.push(function(artifact, callback){
                renderContext['allobjectdata'] = renderContext['publishedobjectdata'].concat(renderContext['subscribedobjectdata']);
                renderContext['allinteractiondata'] = renderContext['publishedinteractiondata'].concat(renderContext['subscribedinteractiondata'])

                self.logger.debug('Rendering template to file: ' + outFileName);
                artifact.addFile(outFileName, ejs.render(TEMPLATES['omnetfilter.cpp.ejs'], renderContext), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }else{
                        outFileName = omnetOutFilePath + MavenPOM.mavenIncludePath + "/" + self.core.getAttribute(node, 'name') + "FilterInit.hpp";
                        self.logger.debug('Rendering template to file: ' + outFileName);
                        artifact.addFile(outFileName, ejs.render(TEMPLATES['omnetfilter.hpp.ejs'], renderContext), callback);
                        return;
                    }
                });
            });
                    
            return {context:context};
        };

        this.createOmnetFederateCodeModel = function(){
            return {
                simname: "",
                projectname: "",
                melderpackagename: null,
                classname: "",
                isnonmapperfed: true,
                timeconstrained: false,
                timeregulating: false,
                lookahead: null,
                asynchronousdelivery: false,
                publishedinteractiondata: [],
                subscribedinteractiondata: [],
                allinteractiondata: [],
                publishedobjectdata: [],
                subscribedobjectdata: [],
                allobjectdata: [],
                helpers:{},
                ejs:ejs, 
                TEMPLATES:TEMPLATES
            };
        }
    }

    return OmnetFederateExporter;
});