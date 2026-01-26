# Management Scripts Guide

This directory contains utility scripts for managing users, sites, and checkpoints in your security patrol tracking system.

## 📝 Table of Contents

1. [Creating Users](#creating-users)
2. [Creating Sites and Checkpoints](#creating-sites-and-checkpoints)
3. [Generating QR Codes](#generating-qr-codes)
4. [How Guards Use QR Codes](#how-guards-use-qr-codes)

---

## 1️⃣ Creating Users

### Using the Script

```bash
# Enter the backend container
docker exec -it security-patrol-backend sh

# Create a new user
node scripts/create-user.js
```

### Programmatic Creation

Edit `scripts/create-user.js` and uncomment the example section, then run:

```javascript
const { createUser } = require('./scripts/create-user');

// Create a guard
await createUser(
  'john.doe@security.com',
  'securePassword123',
  'John Doe',
  'GUARD'
);

// Create a supervisor
await createUser(
  'jane.smith@security.com',
  'securePassword123',
  'Jane Smith',
  'SUPERVISOR'
);


```

### Valid Roles
- `GUARD` - Can start shifts, scan QR codes, log checkpoints
- `SUPERVISOR` - Can view live patrols, alerts, and reports

---

## 2️⃣ Creating Sites and Checkpoints

### Using the Script

```bash
# Enter the backend container
docker exec -it security-patrol-backend sh

# Create a site
node scripts/create-site.js
```

### Example: Creating a Shopping Mall Site

```javascript
const { createSiteWithCheckpoints } = require('./scripts/create-site');

await createSiteWithCheckpoints(
  'Westfield Shopping Center',      // Site name
  '123 Main Street, City, State',   // Address
  40.7589,                          // Latitude
  -73.9851,                         // Longitude
  [
    {
      name: 'North Entrance',
      qrCode: 'WESTFIELD-CHECKPOINT-001',
      latitude: 40.7589,
      longitude: -73.9851
    },
    {
      name: 'South Parking',
      qrCode: 'WESTFIELD-CHECKPOINT-002',
      latitude: 40.7590,
      longitude: -73.9849
    },
    {
      name: 'Food Court',
      qrCode: 'WESTFIELD-CHECKPOINT-003',
      latitude: 40.7588,
      longitude: -73.9853
    }
  ]
);
```

### QR Code Naming Convention

Use a consistent format for QR codes:
```
[SITE-IDENTIFIER]-CHECKPOINT-[NUMBER]
```

Examples:
- `DOWNTOWN-OFFICE-CHECKPOINT-001`
- `WAREHOUSE-A-CHECKPOINT-001`
- `MALL-WEST-CHECKPOINT-001`

**Important:** QR codes must be **unique across the entire system**.

---

## 3️⃣ Generating Physical QR Codes

### Online QR Code Generators (Free)

1. **QR Code Generator** - https://www.qr-code-generator.com/
   - Enter your QR code text (e.g., `WESTFIELD-CHECKPOINT-001`)
   - Select "Text" type
   - Download as PNG or SVG
   - Print and laminate for durability

2. **QRCode Monkey** - https://www.qrcode-monkey.com/
   - Supports custom colors and logos
   - High-resolution downloads

3. **Bulk QR Code Generation** - https://bulk-barcode-generator.com/
   - Generate multiple QR codes at once
   - Export as ZIP

### Recommended QR Code Settings

- **Size:** Minimum 2x2 inches (5x5 cm)
- **Format:** PNG or PDF for printing
- **Resolution:** 300 DPI minimum
- **Error Correction:** High (30%)
- **Material:** Weatherproof laminated stickers

### Printing Tips

1. Print on **waterproof sticker paper**
2. Laminate for outdoor durability
3. Mount at **eye level** (5-6 feet)
4. Ensure good **lighting** for scanning
5. Place in **visible, accessible** locations

---

## 4️⃣ How Guards Use QR Codes

### Guard Workflow

1. **Login to the app** (http://localhost:3000)
   - Use guard credentials

2. **Start a Shift**
   - Select the site they're patrolling
   - Click "Start Shift"

3. **Scan QR Codes at Checkpoints**
   - Navigate to the checkpoint
   - Click "Scan Checkpoint" button
   - Point camera at QR code
   - System automatically:
     - Records timestamp
     - Captures GPS location
     - Associates with current shift
     - Displays confirmation

4. **View Progress**
   - See all logged checkpoints
   - Track patrol completion

5. **End Shift**
   - Click "End Shift" when done
   - System records end time

### What Gets Captured

When a guard scans a QR code, the system records:

```javascript
{
  checkpointId: "uuid",
  checkpointName: "North Entrance",
  timestamp: "2026-01-24T10:30:45.123Z",
  latitude: 40.7589,
  longitude: -73.9851,
  guardId: "uuid",
  guardName: "John Doe",
  shiftId: "uuid"
}
```

### GPS Verification

- Browser requests location permission (first time only)
- Actual GPS coordinates are captured (not checkpoint coordinates)
- Location accuracy typically 5-50 meters
- Guards must allow location access

---

## 5️⃣ Command Reference

### Create User via Docker

```bash
# Single command
docker exec security-patrol-backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

(async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'newguard@security.com',
      password: hashedPassword,
      name: 'New Guard',
      role: 'GUARD'
    }
  });
  console.log('User created:', user.email);
  await prisma.\$disconnect();
})();
"
```

### Create Site via Docker

```bash
docker exec security-patrol-backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const site = await prisma.site.create({
    data: {
      name: 'New Office Building',
      address: '456 Business Ave',
      latitude: 40.7580,
      longitude: -73.9855,
      checkpoints: {
        create: [
          {
            name: 'Main Lobby',
            qrCode: 'NEWOFFICE-CHECKPOINT-001',
            latitude: 40.7580,
            longitude: -73.9855
          }
        ]
      }
    }
  });
  console.log('Site created:', site.name);
  await prisma.\$disconnect();
})();
"
```

### List All Sites and Checkpoints

```bash
docker exec security-patrol-backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const sites = await prisma.site.findMany({
    include: { checkpoints: true }
  });
  sites.forEach(site => {
    console.log(\`\nSite: \${site.name}\`);
    console.log(\`ID: \${site.id}\`);
    site.checkpoints.forEach(cp => {
      console.log(\`  - \${cp.name}: \${cp.qrCode}\`);
    });
  });
  await prisma.\$disconnect();
})();
"
```

---

## 🔒 Security Best Practices

1. **Password Requirements**
   - Minimum 8 characters
   - Mix of letters, numbers, and symbols
   - Different from email

2. **QR Code Protection**
   - Don't reuse QR codes across sites
   - Keep a secure registry of all codes
   - Replace damaged/compromised codes immediately

3. **GPS Validation**
   - Review location discrepancies in supervisor dashboard
   - Alert if guard location is far from checkpoint

4. **Access Control**
   - Only assign GUARD role to field personnel
   - Limit SUPERVISOR access to management


---

## 📊 Monitoring and Reporting

### View Recent Patrol Logs

Access the Supervisor dashboard to:
- See real-time patrol activity
- Check which checkpoints were visited
- Verify GPS coordinates
- Export reports as CSV

### Alert System

Supervisors receive alerts for:
- Missed checkpoints
- Inactive guards (no scans for >1 hour)
- Location discrepancies

---

## 🆘 Troubleshooting

### QR Code Not Scanning

1. Check camera permissions in browser
2. Ensure QR code is clean and undamaged
3. Improve lighting conditions
4. Verify QR code exists in database

### GPS Not Working

1. Enable location services on device
2. Grant browser location permission
3. Check if using HTTPS (required for geolocation)
4. Test outdoors for better GPS signal

### User Can't Login

1. Verify email is correct
2. Check password (case-sensitive)
3. Ensure user exists in database
4. Verify user role matches dashboard access

---

## 📝 Quick Start Checklist

- [ ] Create guard users
- [ ] Create sites with addresses
- [ ] Create checkpoints for each site
- [ ] Generate QR codes from checkpoint codes
- [ ] Print and laminate QR codes
- [ ] Install QR codes at checkpoint locations
- [ ] Test scanning with guard account
- [ ] Train guards on app usage
- [ ] Monitor first patrols via supervisor dashboard

---

For additional support, refer to the main [README.md](../README.md) in the project root.
