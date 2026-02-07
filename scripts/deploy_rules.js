
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Helper to parse .env.local manually
function getEnvConfig() {
    try {
        const envPath = path.join(__dirname, '../.env.local');
        if (!fs.existsSync(envPath)) {
            console.error('No .env.local found');
            process.exit(1);
        }
        const envContent = fs.readFileSync(envPath, 'utf8');
        const config = {};

        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                config[key] = value;
            }
        });
        return config;
    } catch (err) {
        console.error('Error reading .env.local', err);
        process.exit(1);
    }
}

const env = getEnvConfig();
const privateKey = env.FIREBASE_PRIVATE_KEY
    ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

if (!privateKey) {
    console.error('FIREBASE_PRIVATE_KEY not found in .env.local');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
        }),
    });
}

async function deployRules() {
    try {
        const rulesPath = path.join(__dirname, '../firestore.rules');
        let rulesContent = fs.readFileSync(rulesPath, 'utf8');

        // Sanitize content: remove carriage returns for API compatibility
        rulesContent = rulesContent.replace(/\r/g, '');

        console.log('Reading rules from:', rulesPath);
        console.log('Rules content length:', rulesContent.length);

        const ruleset = await admin.securityRules().createRuleset({
            source: {
                files: [{
                    name: 'firestore.rules',
                    content: rulesContent
                }]
            }
        });

        console.log('Created Ruleset:', ruleset.name);

        const release = await admin.securityRules().releaseFirestoreRulesetFromSource(ruleset.source);

        console.log('Released Ruleset:', release.name);
        console.log('SUCCESS: Firestore Rules have been deployed!');
    } catch (error) {
        console.error('Error deploying rules:', error.message);
        if (error.errorInfo) {
            console.error('Error Info:', JSON.stringify(error.errorInfo, null, 2));
        }
        process.exit(1);
    }
}

deployRules();
