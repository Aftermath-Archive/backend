const mongoose = require('mongoose');

/**
 * Define the schema for Incidents in the system. It includes core details such as title, description, date created, environment, createdBy, update section status, assignedTo, updatedBy, resolvedAt, tags for categorization, resolution details, severity level, references relatedLinks, relatedIncidents, case discussion section with message, author, and timestamp. Includes validation and default values.
 * @author Xander
 *
 * @type {*}
 */
const IncidentSchema = new mongoose.Schema(
    {
        // Core Incident Details
        title: {
            type: String,
            required: true,
            trim: true,
        },
        incidentAutoId: {
            type: String,
            unique: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            default: 'Low',
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

        // Scope
        affectedSystems: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        impactSummary: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        stepsToReproduce: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // References
        // Tags for Categorization
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: (tags) => tags.length <= 10,
                message: 'You can only add up to 10 tags.',
            },
        },

        relatedLinks: {
            type: [String],
            default: [],
        },

        relatedIncidents: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'Incident',
            default: [],
        },

        // Update Section
        status: {
            type: String,
            enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
            default: 'Open',
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

        resolutionDetails: {
            type: String,
            default: '',
            maxlength: 1000,
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
