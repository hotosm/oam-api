const cf = require('@mapbox/cloudfriend');

const Parameters = {
    AppName: {
        Type: 'String',
        Description: 'Name of the Application',
        Default: ''
    },
    FunctionName: {
        Type: 'String',
        Description: 'Name of the application function',
        Default: ''
    },
    StagingFunctionVersion: {
        Type: 'String',
        Description: 'Version of staging deployment',
        Default: ''
    },
    ProductionFunctionVersion: {
        Type: 'String',
        Description: 'Version of production deployment',
        Default: ''
    }
};

const Resources = {
    Api: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
            Name: cf.ref('ApiName'),
            BinaryMediaTypes: ['*/*'],
            Description: 'Dynamic processing of open aerial imagery (Managed by up).'
        }
    },
    ApiDeploymentDevelopment: {
        Type: 'AWS::ApiGateway::Deployment',
        DependsOn: ['ApiRootMethod', 'ApiProxyMethod', 'ApiFunctionAliasDevelopment'],
        Properties: {
            StageName: 'development',
            RestApiId: cf.ref('Api'),
            StageDescription: {
                'Variables': {
                    'qualifier': 'development'
                }
            }
        }
    },
    ApiDeploymentStaging: {
        Type: 'AWS::ApiGateway::Deployment',
        DependsOn: ['ApiRootMethod', 'ApiProxyMethod', 'ApiFunctionAliasStaging'],
        Properties: {
            StageName: 'staging',
            RestApiId: cf.ref('Api'),
            StageDescription: {
                Variables: {
                    'qualifier': 'staging'
                }
            }
        }
    },
    ApiDeploymentProduction: {
        Type: 'AWS::ApiGateway::Deployment',
        DependsOn: ['ApiRootMethod', 'ApiProxyMethod', 'ApiFunctionAliasProduction'],
        Properties: {
            StageName: 'production',
            RestApiId: cf.ref('Api'),
            StageDescription: {
                'Variables': {
                    'qualifier': 'production'
                }
            }
        }
    },
    ApiFunctionAliasDevelopment: {
        Type: 'AWS::Lambda::Alias',
        Properties: {
            Name: 'development',
            Description: "Development environment (Managed by Up).",
            FunctionName: cf.ref('FunctionName'),
            FunctionVersion: "$LATEST"
        }
    },
    ApiFunctionAliasStaging: {
        Type: 'AWS::Lambda::Alias',
        Properties: {
            Name: 'staging',
            Description: 'Staging environment (Managed by Up).',
            FunctionName: cf.ref('FunctionName'),
            FunctionVersion: cf.ref('FunctionVersionStaging')
        }
    },
    ApiFunctionAliasProduction: {
        Type: 'AWS::Lambda::Alias',
        Properties: {
            Name: 'production',
            Description: 'Production environment (Managed by Up).',
            FunctionName: cf.ref('FunctionName'),
            FunctionVersion: cf.ref('FunctionVersionProduction')
        }
    },
    ApiLambdaPermissionDevelopment: {
        Type: 'AWS::Lambda::Permission',
        DependsOn: 'ApiFunctionAliasDevelopment',
        Properties: {
            Action: 'lambda:invokeFunction',
            FunctionName: cf.join(':', ["arn", "aws", "lambda", cf.ref('AWS::Region'), cf.ref('AWS::AccountId'), 'function', cf.join(':', [cf.ref('FunctionName'), 'development'])]),
            Principal: 'apigateway.amazonaws.com',
            SourceArn: cf.join('', ['arn:aws:execute-api', ':', cf.ref('AWS::Region'), ':', cf.ref('AWS::AccountId'), ':', cf.ref('Api'), '/*'])
        }
    },
    ApiLambdaPermissionStaging: {
        Type: 'AWS::Lambda::Permission',
        DependsOn: "ApiFunctionAliasStaging",
        Properties: {
            Action: "lambda:invokeFunction",
            FunctionName: cf.join(':', ['arn', 'aws', 'lambda', cf.ref('AWS::Region'), cf.ref('AWS::AccountId'), 'function', cf.join(':', [cf.ref('FunctionName'), 'staging'])]),
            Principal: 'apigateway.amazonaws.com',
            SourceArn: cf.join('', ['arn:aws:execute-api', ':', cf.ref('AWS::Region'), ':', cf.ref('AWS::AccountId'), ':', cf.ref('Api'), '/*'])
        }
    },
    ApiLambdaPermissionProduction: {
        Type: 'AWS::Lambda::Permission',
        DependsOn: 'ApiFunctionAliasProduction',
        Properties: {
            Action: 'lambda:invokeFunction',
            FunctionName: cf.join(':', ['arn', 'aws', 'lambda', cf.ref('AWS::Region'), cf.ref('AWS::AccountId'), 'function', cf.join(':', [cf.ref('FunctionName'), 'production'])]),
            Principal: 'apigateway.amazonaws.com',
            SourceArn: cf.join('', ['arn:aws:execute-api', ':', cf.ref('AWS::Region'), ':', cf.ref('AWS::AccountId'), ':', cf.ref('Api'), '/*'])
        }
    },
    ApiProxyMethod: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'NONE',
            HttpMethod: 'ANY',
            Integration: {
                IntegrationHttpMethod: 'POST',
                Type: 'AWS_PROXY',
                Uri: cf.join('',
                    [
                        'arn:aws:apigateway:',
                        cf.ref('AWS::Region'),
                        ':lambda:path/2015-03-31/functions/',
                        cf.join(':',
                            [
                                'arn',
                                'aws',
                                'lambda',
                                cf.ref('AWS::Region'),
                                cf.ref('AWS::AccountId'),
                                'function',
                                cf.join(':',
                                    [
                                        cf.ref('FunctionName'),
                                        "${stageVariables.qualifier}"
                                    ]
                                )
                            ]
                        ),
                        '/invocations'
                    ]
                )
            },
            ResourceId: cf.ref('ApiProxyResource'),
            RestApiId: cf.ref('Api')
        }
    },
    ApiProxyResource: {
        Type: 'AWS::ApiGateway::Resource',
        Properties: {
            ParentId: cf.getAtt('Api', 'RootResourceId'),
            PathPart: '{proxy+}',
            RestApiId: cf.ref('Api')
        }
    },
    ApiRootMethod: {
        Type: 'AWS::ApiGateway::Method',
        Properties: {
            AuthorizationType: 'NONE',
            HttpMethod: 'ANY',
            Integration: {
                IntegrationHttpMethod: 'POST',
                Type: 'AWS_PROXY',
                Uri: cf.join('',
                    [
                        'arn:aws:apigateway:',
                        cf.ref('AWS::Region'),
                        ':lambda:path/2015-03-31/functions/',
                        cf.join(':',
                            [
                                'arn',
                                'aws',
                                'lambda',
                                cf.ref('AWS::Region'),
                                cf.ref('AWS::AccountId'),
                                'function',
                                cf.join(':',
                                    [
                                        cf.ref('FunctionName'),
                                        "${stageVariables.qualifier}"
                                    ]
                                )
                            ]
                        ),
                        "/invocations"
                    ]
                )
            },
            ResourceId: cf.getAtt('Api', 'RootResourceId'),
            RestApiId: cf.ref('Api')
        }
    }
};

const Outputs = {
    ApiFunctionArn: {
        Description: "API Lambda function ARN",
        Value: cf.join(
            ':',
            [
                'arn',
                'aws',
                'lambda',
                cf.ref('AWS::Region'),
                cf.ref('AWS::AccountId'),
                'function',
                cf.ref('FunctionName')
            ]
        )
    },
    ApiFunctionName: {
        Description: "API Lambda function name",
        Value: cf.ref('FunctionName')
    },
    ApiName: {
        Description: "API name",
        Value: cf.ref("Name")
    }
};

module.exports = {
    Parameters,
    Resources,
    Outputs
};
