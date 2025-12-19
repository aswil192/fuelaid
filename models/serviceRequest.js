const mongoose = require("mongoose");

const serviceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  fueldeliveryboy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },

  // Updated: Category + Sub-service
  serviceCategory: {
    type: String,
    enum: ["roadside", "roadready", "fuel"],
    required: true
  },
  subServices: {
    type: [String],
    required: true
  },

  // Fuel-specific field
  quantity: {
    type: Number,
    required: function () {
      return this.serviceCategory === "fuel" && ["Petrol", "Diesel"].includes(this.subService);
    }
  },

  // Location & contact
  address: {
    type: String,
    required: true
  },
  latitude: Number,
  longitude: Number,

  phone: {
    type: Number,
    required: true
  },
 
  // Media (optional)
  vehiclePhotoPath: {
    type: String
  },

  // Communication
  customerToMechanicMsg: {
    type: String
  },
  mechanicToCustomerMsg: {
    type: String
  },

  // Status tracking
  status: {
    type: String,
    enum: ["requested", "assigned", "accepted", "completed", "in-progress", "rejected"],
    // default: "pending",
    required: true
  },

  // ETA & timestamps
  serviceTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  // Feedback
  feedback: { type: String },
rating: { type: Number, min: 1, max: 5 },
isPaid: { type: Boolean, default: false },
completedAt: { type: Date, default: null },
mechanicNote: {
  type: String,
  default: ''
},
fuelNote: {
  type: String,
  default: ''
},
isFuelRequest: {
  type: Boolean,
  default: false
},
baseAmount: {
  type: Number,
  required: false, // Optional if you want flexibility
  default: 100 // You can set a fallback base price if none provided
},

serviceFee: {
  type: Number,
  default: 0
},
deliveryCharge: {
  type: Number,
  default: 0
},
totalCharges: {
  type: Number,
  default: 0
},
distance: {
  type: Number,
  default: 0 // Save distance in km at assignment time
}


// 
    // timestamps: true // ✅ lowercase `true`
});

const ServiceRequest = mongoose.model("servicerequests", serviceRequestSchema);
module.exports = ServiceRequest;
