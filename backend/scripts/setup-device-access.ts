import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const DEVICE_ACCESS_TABLE = process.env.DYNAMODB_DEVICE_ACCESS_TABLE || 'DeviceAccess';

async function createDeviceAccessTable() {
  try {
    // Check if table exists
    try {
      await client.send(new DescribeTableCommand({ TableName: DEVICE_ACCESS_TABLE }));
      console.log(`✅ Table ${DEVICE_ACCESS_TABLE} already exists`);
      return;
    } catch (error: any) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // Create table
    const command = new CreateTableCommand({
      TableName: DEVICE_ACCESS_TABLE,
      KeySchema: [
        { AttributeName: 'accessId', KeyType: 'HASH' }, // Primary key: userId#deviceId
        { AttributeName: 'createdAt', KeyType: 'RANGE' } // Sort key
      ],
      AttributeDefinitions: [
        { AttributeName: 'accessId', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'deviceId', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'DeviceIdIndex',
          KeySchema: [
            { AttributeName: 'deviceId', KeyType: 'HASH' },
            { AttributeName: 'createdAt', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    });

    await client.send(command);
    console.log(`✅ Table ${DEVICE_ACCESS_TABLE} created successfully`);

    // Wait for table to be active
    console.log('⏳ Waiting for table to be active...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Insert sample data
    await insertSampleData();
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  }
}

async function insertSampleData() {
  console.log('📝 Inserting sample device access records...');

  const sampleRecords = [
    {
      accessId: 'user1#esp32-relay-01',
      userId: 'user1',
      deviceId: 'esp32-relay-01',
      deviceName: 'Living Room Light',
      role: 'owner', // owner, admin, user, viewer
      permissions: ['read', 'write', 'control', 'share', 'delete'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      accessId: 'user2#esp32-relay-01',
      userId: 'user2',
      deviceId: 'esp32-relay-01',
      deviceName: 'Living Room Light',
      role: 'user',
      permissions: ['read', 'control'], // Can only read and control
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  for (const record of sampleRecords) {
    try {
      await docClient.send(new PutCommand({
        TableName: DEVICE_ACCESS_TABLE,
        Item: record
      }));
      console.log(`✅ Added access: ${record.userId} → ${record.deviceId} (${record.role})`);
    } catch (error) {
      console.error(`❌ Error inserting record:`, error);
    }
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifying setup...');
  
  try {
    const result = await docClient.send(new ScanCommand({
      TableName: DEVICE_ACCESS_TABLE,
      Limit: 10
    }));

    console.log(`\n📊 Total device access records: ${result.Count}`);
    console.log('\nSample records:');
    result.Items?.forEach(item => {
      console.log(`  - ${item.userId} → ${item.deviceId} (${item.role})`);
    });
  } catch (error) {
    console.error('❌ Error verifying setup:', error);
  }
}

async function main() {
  console.log('🚀 Setting up Device Access Management...\n');
  
  try {
    await createDeviceAccessTable();
    await verifySetup();
    
    console.log('\n✅ Device Access setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
