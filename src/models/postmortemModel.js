const mongoose = require('mongoose');

const PostMortemSchema = new mongoose.Schema(
    {
        incidentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Incident',
            required: true,
        },
        rootCause: {
            type: String,
            required: true,
            trim: true,
        },
        impact: {
            type: String,
            required: true,
            trim: true,
        },
        actionItems: [
            {
                description: { type: String, required: true, trim: true },
                status: {
                    type: String,
                    enum: ['Pending', 'In Progress', 'Completed'],
                    default: 'Pending',
                },
            },
        ],
        lessonsLearned: {
            type: String,
            default: '',
            trim: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

const PostMortem = mongoose.model('PostMortem', PostMortemSchema);

module.exports = {
    PostMortem,
};
