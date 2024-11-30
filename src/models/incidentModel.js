const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema(
    {
        // Core Incident Details
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        dateCreated: {
            type: Date,
            default: Date.now,
        },
        environment: {
            type: String,
            enum: ['Production', 'Staging', 'Development'],
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // Update Section
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
            default: 'Open',
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        resolvedAt: {
            type: Date,
            default: null,
        },

        // Tags for Categorization
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: (tags) => tags.length <= 10,
                message: 'You can only add up to 10 tags.',
            },
        },

        // Conditional Fields for Resolution
        resolutionDetails: {
            type: String,
            default: '',
            maxlength: 1000,
        },

        // Severity Level
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Low',
        },

        // References
        relatedLinks: {
            type: [String],
            default: [],
        },
        relatedIncidents: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Incident',
            default: [],
        },

        // Case Discussion section
        caseDiscussion: {
            type: [
                {
                    message: { type: String, required: true }, // The comment or note text
                    author: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        required: true,
                    }, // User who added it
                    timestamp: { type: Date, default: Date.now }, // Timestamp for the entry
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

const Incident = mongoose.model('Incident', IncidentSchema);

module.exports = { Incident };
