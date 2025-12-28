import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'ap-southeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const sampleRecords = [
  {
    accessId: 'user1#esp32-relay-01',
    userId: 'user1',
    deviceId: 'esp32-relay-01',
    deviceName: 'Living Room Light',
    role: 'owner',
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
    permissions: ['read', 'control'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function main() {
  for (const record of sampleRecords) {
    await docClient.send(new PutCommand({ TableName: 'DeviceAccess', Item: record }));
    console.log(`✅ Added: ${record.userId} → ${record.deviceId} (${record.role})`);
  }

  const result = await docClient.send(new ScanCommand({ TableName: 'DeviceAccess', Limit: 10 }));
  console.log(`\n📊 Total records: ${result.Count}`);
}

main().catch(console.error);
