const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testCompanyTracking() {
    try {
        // Test 1: Track a new company
        console.log('Test 1: Tracking a new company...');
        const trackResponse = await axios.post(`${API_BASE_URL}/companies/track`, {
            company_name: 'Test Company',
            company_website: 'https://testcompany.com',
            industry: 'Technology',
            importance_level: 2
        });
        console.log('Success:', trackResponse.data);

        // Test 2: Get tracked companies
        console.log('\nTest 2: Getting tracked companies...');
        const trackedResponse = await axios.get(`${API_BASE_URL}/companies/tracked`);
        console.log('Success:', trackedResponse.data);

        // Test 3: Get news feed
        console.log('\nTest 3: Getting news feed...');
        const newsResponse = await axios.get(`${API_BASE_URL}/news/feed`);
        console.log('Success:', newsResponse.data);

        // Test 4: Test free tier limit
        console.log('\nTest 4: Testing free tier limit...');
        try {
            for (let i = 0; i < 6; i++) {
                await axios.post(`${API_BASE_URL}/companies/track`, {
                    company_name: `Test Company ${i}`,
                    company_website: `https://testcompany${i}.com`,
                    industry: 'Technology',
                    importance_level: 1
                });
            }
        } catch (error) {
            console.log('Expected error:', error.response?.data);
        }

    } catch (error) {
        console.error('Test failed:', error.response?.data || error.message);
    }
}

testCompanyTracking(); 