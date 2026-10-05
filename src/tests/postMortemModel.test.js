const { PostMortem } = require('../models/postmortemModel');

describe('Post-mortem model', () => {
    test('has a unique incident index to prevent concurrent duplicate reports', () => {
        expect(PostMortem.schema.indexes()).toContainEqual([
            { incidentId: 1 },
            expect.objectContaining({ unique: true }),
        ]);
    });

    test('supplies report and action item defaults and trims text', async () => {
        const postMortem = new PostMortem({
            incidentId: '507f1f77bcf86cd799439011',
            createdBy: '507f1f77bcf86cd799439013',
            rootCause: '  Timeout  ',
            impact: '  API unavailable  ',
            actionItems: [{ description: '  Monitor  ' }],
        });
        await expect(postMortem.validate()).resolves.toBeUndefined();
        expect(postMortem.rootCause).toBe('Timeout');
        expect(postMortem.impact).toBe('API unavailable');
        expect(postMortem.lessonsLearned).toBe('');
        expect(postMortem.actionItems[0].description).toBe('Monitor');
        expect(postMortem.actionItems[0].status).toBe('Pending');
    });
});
