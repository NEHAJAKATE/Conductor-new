"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockarooGenerator = exports.MockarooGenerator = void 0;
const uuid_1 = require("uuid");
const config_1 = require("../../config");
const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'Singapore', 'Japan'];
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const DEVICES = ['Desktop', 'Mobile', 'Tablet'];
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const REFERRALS = ['Google', 'Direct', 'Facebook', 'LinkedIn', 'Newsletter'];
const CAMPAIGNS = ['Summer Sale 2026', 'Product Launch v2', 'Retargeting Autumn', 'Developer API Promos', 'Black Friday Draft'];
const NAMES_MALE = ['Rahul Sharma', 'Amit Patel', 'John Doe', 'David Smith', 'Michael Green', 'Kenji Tanaka', 'Arjun Nair', 'Vikram Singh'];
const NAMES_FEMALE = ['Sarah Jenkins', 'Neha Jakate', 'Pooja Reddy', 'Emily Watson', 'Sophia Miller', 'Yuki Sato', 'Anjali Gupta', 'Emma Davis'];
class MockarooGenerator {
    generateIdentities(count = 20) {
        const list = [];
        for (let i = 0; i < count; i++) {
            const isMale = Math.random() > 0.5;
            const name = isMale
                ? NAMES_MALE[Math.floor(Math.random() * NAMES_MALE.length)]
                : NAMES_FEMALE[Math.floor(Math.random() * NAMES_FEMALE.length)];
            const firstName = name.split(' ')[0].toLowerCase();
            const lastName = name.split(' ')[1].toLowerCase();
            const email = `${firstName}.${lastName}${Math.floor(100 + Math.random() * 900)}@example.com`;
            const phone = `+${Math.floor(910000000000 + Math.random() * 89999999999)}`;
            const year = 1970 + Math.floor(Math.random() * 35);
            const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
            const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
            const dob = `${year}-${month}-${day}`;
            const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
            const city = country === 'India' ? 'Mumbai' : country === 'United States' ? 'New York' : 'London';
            const address = `${Math.floor(10 + Math.random() * 900)}, Park Street, ${city}, ${country}`;
            const panChars = 'ABCDE';
            let pan = '';
            for (let j = 0; j < 5; j++)
                pan += panChars[Math.floor(Math.random() * panChars.length)];
            pan += String(Math.floor(1000 + Math.random() * 9000));
            pan += 'P';
            const aadhaar = `${Math.floor(2000 + Math.random() * 7999)} ${Math.floor(1000 + Math.random() * 8999)} ${Math.floor(1000 + Math.random() * 8999)}`;
            const passport = `Z${Math.floor(1000000 + Math.random() * 8999999)}`;
            const customerId = `CUST-${Math.floor(10000 + Math.random() * 89999)}`;
            const uuid = (0, uuid_1.v5)(`email:${email.toLowerCase().trim()}`, config_1.config.identity.namespace);
            const segment = Math.random() > 0.85 ? 'VIP' : Math.random() > 0.8 ? 'Churn-Risk' : Math.random() > 0.9 ? 'Inactive' : 'Regular';
            list.push({
                customerId,
                name,
                email,
                phone,
                dob,
                address,
                pan,
                aadhaar,
                passport,
                gender: isMale ? 'Male' : 'Female',
                country,
                uuid,
                segment
            });
        }
        return list;
    }
    generateBehavioral(identities, count = 50) {
        const list = [];
        const eventTypes = [
            'Visited Website', 'Added Cart', 'Purchased', 'Refund', 'Support Ticket', 'Email Open', 'Bank Transaction'
        ];
        for (let i = 0; i < count; i++) {
            const identity = identities[Math.floor(Math.random() * identities.length)];
            const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const timestamp = new Date(Date.now() - Math.floor(Math.random() * 10 * 24 * 3600000)).toISOString();
            const campaign = CAMPAIGNS[Math.floor(Math.random() * CAMPAIGNS.length)];
            const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
            const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
            const referral = REFERRALS[Math.floor(Math.random() * REFERRALS.length)];
            let details = `User performed ${type} activity.`;
            if (type === 'Visited Website')
                details = `Visited page path: /products/${campaign.toLowerCase().replace(/ /g, '-')}`;
            else if (type === 'Purchased')
                details = `Checked out order. Campaign referral: ${campaign}`;
            else if (type === 'Support Ticket')
                details = `Created support request regarding invoice validation.`;
            list.push({
                eventId: `EVT-${Math.floor(100000 + Math.random() * 899999)}`,
                customerId: identity.customerId,
                email: identity.email,
                type,
                timestamp,
                source: 'Web Tracker SDK',
                details,
                campaign,
                device,
                browser,
                geo: identity.country,
                referral
            });
        }
        return list;
    }
    generateFinancial(identities, count = 30) {
        const list = [];
        const subs = ['Bronze Plan Tier', 'Silver Enterprise Tier', 'Gold Growth Tier', 'Conductor Suite Pro'];
        for (let i = 0; i < count; i++) {
            const identity = identities[Math.floor(Math.random() * identities.length)];
            const amount = Math.floor(150 + Math.random() * 8500);
            const isPaid = Math.random() > 0.15;
            const isRefunded = !isPaid && Math.random() > 0.7;
            const status = isRefunded ? 'Refunded' : isPaid ? 'Paid' : 'Unpaid';
            const date = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 3600000)).toISOString();
            const balance = status === 'Unpaid' ? amount : 0;
            const subIndex = Math.floor(Math.random() * subs.length);
            const subscriptionPrice = [19, 49, 149, 499][subIndex];
            list.push({
                transactionId: `TXN-${Math.floor(100000 + Math.random() * 899999)}`,
                customerId: identity.customerId,
                email: identity.email,
                invoiceId: `INV-${Math.floor(1000 + Math.random() * 8999)}`,
                amount,
                date,
                status,
                outstandingBalance: balance,
                creditLimit: Math.random() > 0.8 ? 50000 : 15000,
                subscriptionName: subs[subIndex],
                subscriptionPrice,
                creditScore: Math.floor(600 + Math.random() * 220),
                lifetimeValue: amount + Math.floor(Math.random() * 10000),
                balance: Math.floor(5000 + Math.random() * 150000)
            });
        }
        return list;
    }
}
exports.MockarooGenerator = MockarooGenerator;
exports.mockarooGenerator = new MockarooGenerator();
