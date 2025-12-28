#!/bin/bash
# AWS IoT Core Certificate and Thing Verification Script

AWS_REGION="ap-southeast-1"
THING_NAME="esp32-relay-01"

echo "========================================="
echo "AWS IoT Core Verification Script"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found. Please install AWS CLI first.${NC}"
    echo "  Download from: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI found${NC}"
echo ""

# Get current AWS identity
echo "Getting current AWS identity..."
IDENTITY=$(aws sts get-caller-identity --region $AWS_REGION 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to authenticate with AWS. Please configure AWS CLI.${NC}"
    echo "  Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(echo $IDENTITY | grep -o '"Account": "[^"]*"' | cut -d'"' -f4)
echo -e "${GREEN}✓ Authenticated as account: $ACCOUNT_ID${NC}"
echo ""

# List things
echo "Getting IoT Things..."
THINGS=$(aws iot list-things --region $AWS_REGION --query 'things[*].thingName' --output text)
if [ -z "$THINGS" ]; then
    echo -e "${RED}✗ No IoT Things found in region $AWS_REGION${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found Things: $THINGS${NC}"
echo ""

# Check specific thing
echo "Checking Thing: $THING_NAME"
THING=$(aws iot describe-thing --thing-name $THING_NAME --region $AWS_REGION 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠ Thing '$THING_NAME' not found. Available things: $THINGS${NC}"
    echo "  Create it with: aws iot create-thing --thing-name $THING_NAME --region $AWS_REGION"
    exit 1
fi

echo -e "${GREEN}✓ Thing found: $THING_NAME${NC}"
echo ""

# Get principals attached to thing
echo "Getting certificates attached to $THING_NAME..."
PRINCIPALS=$(aws iot list-thing-principals --thing-name $THING_NAME --region $AWS_REGION --query 'principals[]' --output text)
if [ -z "$PRINCIPALS" ]; then
    echo -e "${RED}✗ No certificates attached to Thing $THING_NAME${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found certificates:${NC}"
echo "$PRINCIPALS"
echo ""

# Check each certificate
for PRINCIPAL in $PRINCIPALS; do
    echo "Checking certificate: $PRINCIPAL"
    
    # Extract certificate ID
    CERT_ID=$(echo $PRINCIPAL | grep -o '[a-f0-9]*' | head -1)
    
    # Get certificate status
    CERT_INFO=$(aws iot describe-certificate --certificate-id $CERT_ID --region $AWS_REGION 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠ Could not get certificate info${NC}"
        continue
    fi
    
    STATUS=$(echo $CERT_INFO | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}  ✓ Status: $STATUS${NC}"
    
    # Check policies
    POLICIES=$(aws iot list-principal-policies --principal $PRINCIPAL --region $AWS_REGION --query 'policies[*].policyName' --output text)
    if [ -z "$POLICIES" ]; then
        echo -e "${RED}  ✗ No policies attached to this certificate${NC}"
        echo "    Attach a policy with: aws iot attach-principal-policy --principal $PRINCIPAL --policy-name IoTPolicy"
    else
        echo -e "${GREEN}  ✓ Policies: $POLICIES${NC}"
        
        # Check policy content
        for POLICY in $POLICIES; do
            POLICY_DOC=$(aws iot get-policy --policy-name $POLICY --region $AWS_REGION --query 'policyDocument' --output text)
            if [[ $POLICY_DOC == *"iot:"* ]]; then
                echo -e "${GREEN}    ✓ Policy '$POLICY' looks valid${NC}"
            else
                echo -e "${YELLOW}    ⚠ Policy '$POLICY' might be restrictive${NC}"
            fi
        done
    fi
    
    echo ""
done

# Check endpoint
echo "Getting AWS IoT Endpoint..."
ENDPOINT=$(aws iot describe-endpoint --endpoint-type iot:Data-ATS --region $AWS_REGION --query 'endpointAddress' --output text)
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Could not get endpoint${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Endpoint: $ENDPOINT${NC}"
echo ""

# Summary
echo "========================================="
echo "Summary:"
echo "========================================="
echo -e "${GREEN}✓ AWS Account: $ACCOUNT_ID${NC}"
echo -e "${GREEN}✓ Region: $AWS_REGION${NC}"
echo -e "${GREEN}✓ Thing: $THING_NAME${NC}"
echo -e "${GREEN}✓ Endpoint: $ENDPOINT${NC}"
echo -e "${GREEN}✓ Certificate(s): Found${NC}"
echo ""
echo "If ESP32 is still not connecting, check:"
echo "1. Certificate is ACTIVE (not revoked)"
echo "2. Certificate has proper IoT policy attached"
echo "3. Policy allows 'iot:*' or specific MQTT actions"
echo "4. Endpoint in ESP32 code matches: $ENDPOINT:8883"
echo ""
