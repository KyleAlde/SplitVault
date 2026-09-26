export const currentUser = {
    id: 'usr_01',
    firstName: 'Kyle',
    lastName: 'Alde',
    name: 'Kyle Alde',
    initials: 'KA',
    phone: '0912 345 6789',
    email: 'kyle.alde@gmail.com',
    role: 'Treasurer',
    orgName: 'Computer Science Society',
    unreadNotifications: false,
};

export const budgetPools = [
    {
        id: 'pool-hackathon-2026',
        name: 'Annual Hackathon 2026',
        totalBudget: 150000.00,
        totalSpent: 62500.00,
        pendingApprovalsCount: 5,        // Updated to 5
        pendingApprovalsTotal: 22000.00, // Updated total
        categories: [
            { name: 'Venue & Catering', spent: 32000.00, budget: 60000.00, color: '#059669' },
            { name: 'Swag & Merchandise', spent: 18500.00, budget: 40000.00, color: '#425b9a' },
            { name: 'Prizes & Tokens', spent: 8000.00, budget: 30000.00, color: '#f59e0b' },
            { name: 'Logistics & Equipment', spent: 4000.00, budget: 20000.00, color: '#3b82f6' },
        ],
        claims: [
            // Venue & Catering (Total Approved: 32,000)
            { id: 'clm-101', title: 'Venue Downpayment (50%)', claimant: 'Maria Santos', category: 'Venue & Catering', amount: 15000.00, date: '2026-09-10', status: 'Approved' },
            { id: 'clm-102', title: 'Day 1 Lunch Buffets', claimant: 'Maria Santos', category: 'Venue & Catering', amount: 12000.00, date: '2026-09-15', status: 'Approved' },
            { id: 'clm-103', title: 'Tables & Chairs Rental', claimant: 'Patricia Lim', category: 'Venue & Catering', amount: 5000.00, date: '2026-09-16', status: 'Approved' },
            
            // Swag & Merchandise (Total Approved: 18,500)
            { id: 'clm-104', title: 'Custom T-Shirts (Batch 1)', claimant: 'Alex Reyes', category: 'Swag & Merchandise', amount: 10000.00, date: '2026-09-18', status: 'Approved' },
            { id: 'clm-105', title: 'Lanyards and ID PVC Printing', claimant: 'Alex Reyes', category: 'Swag & Merchandise', amount: 4500.00, date: '2026-09-20', status: 'Approved' },
            { id: 'clm-106', title: 'Die-cut Laptop Stickers', claimant: 'Gabriel Gomez', category: 'Swag & Merchandise', amount: 4000.00, date: '2026-09-21', status: 'Approved' },
            
            // Prizes & Tokens (Total Approved: 8,000)
            { id: 'clm-107', title: 'Winner Acrylic Trophies', claimant: 'Juan Dela Cruz', category: 'Prizes & Tokens', amount: 5000.00, date: '2026-09-22', status: 'Approved' },
            { id: 'clm-108', title: 'Consolation Gift Vouchers', claimant: 'Juan Dela Cruz', category: 'Prizes & Tokens', amount: 3000.00, date: '2026-09-22', status: 'Approved' },
            
            // Logistics & Equipment (Total Approved: 4,000)
            { id: 'clm-109', title: 'Heavy Duty Extension Cords', claimant: 'Patricia Lim', category: 'Logistics & Equipment', amount: 1500.00, date: '2026-09-23', status: 'Approved' },
            { id: 'clm-110', title: 'HDMI Splitters & Cables', claimant: 'Patricia Lim', category: 'Logistics & Equipment', amount: 1000.00, date: '2026-09-24', status: 'Approved' },
            { id: 'clm-111', title: 'Walkie Talkies (Rental)', claimant: 'Patricia Lim', category: 'Logistics & Equipment', amount: 1500.00, date: '2026-09-24', status: 'Approved' },

            // Pending Claims (Total: 22,000 | Count: 5)
            { id: 'clm-112', title: 'Day 2 Meals & PM Snacks', claimant: 'Maria Santos', category: 'Venue & Catering', amount: 8000.00, date: '2026-09-25', status: 'Pending' },
            { id: 'clm-113', title: 'Grand Prize Cash Pool', claimant: 'Juan Dela Cruz', category: 'Prizes & Tokens', amount: 5000.00, date: '2026-09-25', status: 'Pending' },
            { id: 'clm-114', title: 'Projector & Screen Rental', claimant: 'Patricia Lim', category: 'Logistics & Equipment', amount: 1500.00, date: '2026-09-26', status: 'Pending' },
            { id: 'clm-115', title: 'Extra Hackathon Hoodies', claimant: 'Alex Reyes', category: 'Swag & Merchandise', amount: 5500.00, date: '2026-09-26', status: 'Pending' }, // NEW
            { id: 'clm-116', title: 'Coffee Bar Station Deposit', claimant: 'Maria Santos', category: 'Venue & Catering', amount: 2000.00, date: '2026-09-26', status: 'Pending' },       // NEW
        ],
    },
    {
        id: 'pool-gma-2026',
        name: 'General Membership Assembly',
        totalBudget: 45000.00,
        totalSpent: 21800.00,
        pendingApprovalsCount: 2,
        pendingApprovalsTotal: 3200.00,
        categories: [
            { name: 'Food & Refreshments', spent: 14500.00, budget: 25000.00, color: '#059669' },
            { name: 'Certificates & Prints', spent: 4300.00, budget: 10000.00, color: '#f59e0b' },
            { name: 'Speaker Tokens', spent: 3000.00, budget: 10000.00, color: '#425b9a' },
        ],
        claims: [
            // Food & Refreshments (Total Approved: 14,500)
            { id: 'clm-201', title: 'AM Snacks (Pastries Box)', claimant: 'Rene Garcia', category: 'Food & Refreshments', amount: 3500.00, date: '2026-09-18', status: 'Approved' },
            { id: 'clm-202', title: 'Packed Lunch Set for Members', claimant: 'Rene Garcia', category: 'Food & Refreshments', amount: 8000.00, date: '2026-09-19', status: 'Approved' },
            { id: 'clm-203', title: 'Bottled Water & Brewed Coffee', claimant: 'Rene Garcia', category: 'Food & Refreshments', amount: 3000.00, date: '2026-09-19', status: 'Approved' },

            // Certificates & Prints (Total Approved: 4,300)
            { id: 'clm-204', title: 'Specialty Paper (10 packs)', claimant: 'Carlos Mendoza', category: 'Certificates & Prints', amount: 1500.00, date: '2026-09-20', status: 'Approved' },
            { id: 'clm-205', title: 'Printer Ink Replacements', claimant: 'Carlos Mendoza', category: 'Certificates & Prints', amount: 1800.00, date: '2026-09-21', status: 'Approved' },
            { id: 'clm-206', title: 'Main Stage Tarpaulin Banner', claimant: 'Carlos Mendoza', category: 'Certificates & Prints', amount: 1000.00, date: '2026-09-22', status: 'Approved' },

            // Speaker Tokens (Total Approved: 3,000)
            { id: 'clm-207', title: 'Plaque & Basket (Keynote 1)', claimant: 'Bea Alonzo', category: 'Speaker Tokens', amount: 1500.00, date: '2026-09-24', status: 'Approved' },
            { id: 'clm-208', title: 'Plaque & Basket (Keynote 2)', claimant: 'Bea Alonzo', category: 'Speaker Tokens', amount: 1500.00, date: '2026-09-24', status: 'Approved' },

            // Pending Claims (Total: 3,200 | Count: 2)
            { id: 'clm-209', title: 'PM Snacks (Pizza Delivery)', claimant: 'Rene Garcia', category: 'Food & Refreshments', amount: 2500.00, date: '2026-09-25', status: 'Pending' },
            { id: 'clm-210', title: 'Photo Booth Backdrop Print', claimant: 'Carlos Mendoza', category: 'Certificates & Prints', amount: 700.00, date: '2026-09-26', status: 'Pending' },
        ],
    },
    {
        id: 'pool-tech-workshops',
        name: 'Tech Workshops & Bootcamps',
        totalBudget: 35000.00,
        totalSpent: 9800.00,
        pendingApprovalsCount: 2,
        pendingApprovalsTotal: 4500.00,
        categories: [ 
            { name: 'Software & Hosting', spent: 4800.00, budget: 15000.00, color: '#425b9a' },
            { name: 'Workshop Snacks', spent: 5000.00, budget: 20000.00, color: '#059669' },
        ],
        claims: [
            // Software & Hosting (Total Approved: 4,800)
            { id: 'clm-301', title: 'Org Web Domain (1 Year)', claimant: 'Dev Team Lead', category: 'Software & Hosting', amount: 800.00, date: '2026-09-10', status: 'Approved' },
            { id: 'clm-302', title: 'AWS Cloud Hosting (Q3)', claimant: 'Dev Team Lead', category: 'Software & Hosting', amount: 2500.00, date: '2026-09-15', status: 'Approved' },
            { id: 'clm-303', title: 'Zoom Pro License Upgrade', claimant: 'Dev Team Lead', category: 'Software & Hosting', amount: 1500.00, date: '2026-09-15', status: 'Approved' },

            // Workshop Snacks (Total Approved: 5,000)
            { id: 'clm-304', title: 'Git Workshop (Pizza)', claimant: 'John Tan', category: 'Workshop Snacks', amount: 2000.00, date: '2026-09-18', status: 'Approved' },
            { id: 'clm-305', title: 'React Basics (Donuts/Coffee)', claimant: 'John Tan', category: 'Workshop Snacks', amount: 1500.00, date: '2026-09-19', status: 'Approved' },
            { id: 'clm-306', title: 'UI/UX Session (Sandwiches)', claimant: 'John Tan', category: 'Workshop Snacks', amount: 1500.00, date: '2026-09-20', status: 'Approved' },

            // Pending Claims (Total: 4,500 | Count: 2)
            { id: 'clm-307', title: 'Figma Pro Seats (Design Team)', claimant: 'Dev Team Lead', category: 'Software & Hosting', amount: 3000.00, date: '2026-09-25', status: 'Pending' },
            { id: 'clm-308', title: 'Next.js Workshop (Pancit & Drinks)', claimant: 'John Tan', category: 'Workshop Snacks', amount: 1500.00, date: '2026-09-26', status: 'Pending' },
        ],
    },
];