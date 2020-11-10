const cf = require('@mapbox/cloudfriend');

const Parameters = {
    ApiName: {
        Type: 'String',
        Description: 'Name of the Application',
        Default: ''
    },
    FunctionName: {
        Type: 'String',
        Description: 'Name of the application function',
        Default: 'marblecutter-production'
    },
    StagingFunctionVersion: {
        Type: 'String',
        Description: 'Version of staging deployment',
        Default: '1'
    },
    ProductionFunctionVersion: {
        Type: 'String',
        Description: 'Version of production deployment',
        Default: '1'
    },
    SecurityGroup: {
        Type: 'AWS::EC2::SecurityGroup::Id',
        Description: 'ID of security group that is in the subnet'
    },
    Subnets: {
        Description: 'List of 6 ELB subnets',
        Type: 'List<AWS::EC2::Subnet::Id>'
    }
};

const Resources = {

    ///////////////////////////////
    // OAM Browser Dynamic Tiler //
    ///////////////////////////////
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
            FunctionVersion: cf.ref('StagingFunctionVersion')
        }
    },
    ApiFunctionAliasProduction: {
        Type: 'AWS::Lambda::Alias',
        Properties: {
            Name: 'production',
            Description: 'Production environment (Managed by Up).',
            FunctionName: cf.ref('FunctionName'),
            FunctionVersion: cf.ref('ProductionFunctionVersion')
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
    },
    /////////////////////////////////
    // OAM Upload Batch Processing //
    /////////////////////////////////
    BatchComputeEnv100: {
        Type: 'AWS::Batch::ComputeEnvironment',
        Properties: {
            ComputeEnvironmentName: cf.join('-', [cf.stackName, 'ce100']),
            ComputeResources: {
                'AllocationStrategy': 'BEST_FIT',
                'BidPercentage': 100,
                'DesiredvCpus': 0,
                'MinvCpus': 0,
                'MaxvCpus': 256,
                'SpotIamFleetRole': cf.join('', ['arn:aws:iam::', cf.accountId, ':role/aws-ec2-spot-fleet-role']),
                'InstanceTypes': ['optimal'],
                'InstanceRole': cf.join('', ['arn:aws:iam::', cf.accountId, ':instance-profile/ecsInstanceRole']), // same as above
                'Type': 'SPOT',
                'Subnets': cf.ref('Subnets'),
                'SecurityGroupIds': [cf.ref('SecurityGroup')],
                'Tags': {'Project': 'OpenAerialMap'}
            },
            ServiceRole: cf.join('', ['arn:aws:iam::', cf.accountId, ':role/service-role/AWSBatchServiceRole']), 
            State: 'ENABLED',
            Tags: {
                'Name': cf.stackName,
                'Project': 'OpenAerialMap'
            },
            Type: 'MANAGED'
        }
    },
    BatchComputeEnv50: {
        Type: 'AWS::Batch::ComputeEnvironment',
        Properties: {
            ComputeEnvironmentName: cf.join('-', [cf.stackName, 'ce50']),
            ComputeResources: {
                'AllocationStrategy': 'BEST_FIT',
                'BidPercentage': 50,
                'DesiredvCpus': 0,
                'MinvCpus': 0,
                'MaxvCpus': 256,
                'SpotIamFleetRole': cf.join('', ['arn:aws:iam::', cf.accountId, ':role/aws-ec2-spot-fleet-role']), 
                'InstanceTypes': ['optimal'],
                'InstanceRole': cf.join('', ['arn:aws:iam::', cf.accountId, ':instance-profile/ecsInstanceRole']), 
                'Type': 'SPOT',
                'Subnets': cf.ref('Subnets'), 
                'SecurityGroupIds': [cf.ref('SecurityGroup')],
                'Tags': {
                    'Name': cf.stackName,
                    'Project': 'OpenAerialMap'
                }
            },
            ServiceRole: cf.join('', ['arn:aws:iam::', cf.accountId, ':role/service-role/AWSBatchServiceRole']), 
            State: 'ENABLED',
            Tags: {
                'Project': 'OpenAerialMap'
            },
            Type: 'MANAGED'
        }
    },
    BatchJobDefinition: {
        Type: 'AWS::Batch::JobDefinition',
        Properties: {
            Type: 'container',
            JobDefinitionName: cf.join('-', [cf.stackName, 'job', 'definition']),
            ContainerProperties: {
                Command: ["process.sh","Ref::input","Ref::output","Ref::callback_url"],
                Environment: [{
                    'Name': 'EFS_HOST',
                    'Value': cf.join('.', [cf.ref('BatchScratchStorageFileSystem'), 'efs', cf.region, 'amazonaws.com']), 
                    }],
                Image: 'quay.io/mojodna/marblecutter-tools',
                JobRoleArn: cf.ref('BatchJobRole'),
                Memory: 3000,
                Privileged: true,
                Vcpus: 1
            },
            RetryStrategy: {
                Attempts: 2
            },
            Tags: {
                'Name': cf.stackName,
                'Project':'OpenAerialMap'
            }
        }
    },
    BatchJobRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Principal: {
                        Service: [ 'ecs-tasks.amazonaws.com' ]
                    },
                    Action: [ "sts:AssumeRole" ]
                }]
            },
            ManagedPolicyArns: [
                'arn:aws:iam::aws:policy/AmazonS3FullAccess' //this needs to be limited
            ]
        }
    },
    BatchJobQueue: {
        Type: 'AWS::Batch::JobQueue',
        Properties: {
            JobQueueName: cf.stackName,
            ComputeEnvironmentOrder: [{
                ComputeEnvironment: cf.ref('BatchComputeEnv100'),
                Order: 0
            }],
            Priority: 10,
            State: 'ENABLED',
            Tags: {
                'Name': cf.stackName,
                'Project':'OpenAerialMap'
            }
        }
    },
    BatchScratchStorageFileSystem: {
        Type: 'AWS::EFS::FileSystem',
        Properties: {
            FileSystemTags: [
                {
                    Key:"Name",
                    Value: cf.stackName
                },
                {
                    Key:"Project",
                    Value:"OpenAerialMap"
                }
            ],
            PerformanceMode: 'generalPurpose'
        }
    },
    BatchScratchStorageMountTarget0: {
        Type: 'AWS::EFS::MountTarget',
        Properties: {
            FileSystemId: cf.ref('BatchScratchStorageFileSystem'),
            SecurityGroups: [cf.ref('SecurityGroup')],
            SubnetId: cf.select(0, cf.ref('Subnets'))
        }
    },
    BatchScratchStorageMountTarget1: {
        Type: 'AWS::EFS::MountTarget',
        Properties: {
            FileSystemId: cf.ref('BatchScratchStorageFileSystem'),
            SecurityGroups: [cf.ref('SecurityGroup')],
            SubnetId: cf.select(1, cf.ref('Subnets'))
        }
    },
    BatchScratchStorageMountTarget2: {
        Type: 'AWS::EFS::MountTarget',
        Properties: {
            FileSystemId: cf.ref('BatchScratchStorageFileSystem'),
            SecurityGroups: [cf.ref('SecurityGroup')],
            SubnetId: cf.select(2, cf.ref('Subnets'))
        }
    },
    BatchScratchStorageMountTarget3: {
        Type: 'AWS::EFS::MountTarget',
        Properties: {
            FileSystemId: cf.ref('BatchScratchStorageFileSystem'),
            SecurityGroups: [cf.ref('SecurityGroup')],
            SubnetId: cf.select(3, cf.ref('Subnets'))
        }
    },
    BatchScratchStorageMountTarget4: {
        Type: 'AWS::EFS::MountTarget',
        Properties: {
            FileSystemId: cf.ref('BatchScratchStorageFileSystem'),
            SecurityGroups: [cf.ref('SecurityGroup')],
            SubnetId: cf.select(4, cf.ref('Subnets'))
        }
    },
    BatchScratchStorageMountTarget5: {
        Type: 'AWS::EFS::MountTarget',
        Properties: {
            FileSystemId: cf.ref('BatchScratchStorageFileSystem'),
            SecurityGroups: [cf.ref('SecurityGroup')],
            SubnetId: cf.select(5, cf.ref('Subnets'))
        }
    },
};

const lambda = new cf.shortcuts.Lambda({
    LogicalName: 'MarbleCutterProduction',
    Description: 'Marblecutter Production Lambda',
    MemorySize: 1536,
    Timeout: 18,
    Runtime: 'nodejs10.x',  // TODO: UPDATE
    Handler: '_proxy.handle',
    Code: { // TODO: FIND OUT
        S3Bucket: 'bucket-name',
        S3Key: 'path/to/file.zip'
    },
    Environment: {
        Variables: {  // TODO: PARAMETERIZE
            CPL_TMPDIR: '/tmp',
            GDAL_CACHEMAX: '512',
            GDAL_DISABLE_READDIR_ON_OPEN: 'TRUE',
            GDAL_HTTP_MERGE_CONSECUTIVE_RANGES: 'YES',
            GDAL_HTTP_VERSION: '2',
            PYTHONPATH: '.pypath/',
            REMOTE_CATALOG_BASE_URL: 'https://api.openaerialmap.org',
            S3_BUCKET: 'oin-hotosm',
            UP_AUTHOR: 'Seth Fitzsimmons',
            UP_COMMIT: '3df59b4',
            UP_STAGE: 'staging',
            VSI_CACHE: 'TRUE',
            VSI_CACHE_SIZE: '536870912',
        }
    },
    Statement: [
        {
            Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'ssm:GetParametersByPath',
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface'
            ],
            Effect: 'Allow',
            Resource: '*'  // TODO: TOO DANGEROUS: SCOPE OUT
        }
    ]
});

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
        Value: cf.ref("ApiName")
    }
};

module.exports = cf.merge(
    {
        Parameters,
        Resources,
        Outputs
    },
    lambda
);
