import mongoose, { Schema } from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/syncvas";

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("[MongoDB] Connected to", MONGO_URI);
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err);
  }
}

const PointSchema = new Schema({ x: Number, y: Number }, { _id: false });

const StrokeSchema = new Schema({
  id:          { type: String, required: true, unique: true },
  roomId:      { type: String, required: true, index: true },
  userId:      String,
  tool:        String,
  points:      [PointSchema],
  color:       String,
  width:       Number,
  timestamp:   { type: Number, index: true },
  text:        String,
  fillColor:   String,
  strokeColor: String,
  smoothed:    Boolean,
}, { versionKey: false });

StrokeSchema.index({ roomId: 1, timestamp: -1 });

const StickySchema = new Schema({
  id:        { type: String, required: true, unique: true },
  roomId:    { type: String, required: true, index: true },
  userId:    String,
  x: Number, y: Number,
  width: Number, height: Number,
  text:      String,
  color:     String,
  timestamp: { type: Number, index: true },
  markdown:  Boolean,
}, { versionKey: false });

StickySchema.index({ roomId: 1, timestamp: -1 });

const MessageSchema = new Schema({
  id:        { type: String, required: true, unique: true },
  roomId:    { type: String, required: true, index: true },
  userId:    String,
  username:  String,
  text:      String,
  timestamp: { type: Number, index: true },
  mentions:  [String],
}, { versionKey: false });

MessageSchema.index({ roomId: 1, timestamp: -1 });

export const StrokeModel  = mongoose.model("Stroke",  StrokeSchema);
export const StickyModel  = mongoose.model("Sticky",  StickySchema);
export const MessageModel = mongoose.model("Message", MessageSchema);

export async function saveStroke(roomId: string, stroke: any) {
  try {
    await StrokeModel.updateOne(
      { id: stroke.id },
      { $set: { ...stroke, roomId } },
      { upsert: true }
    );
  } catch (err) {
    console.error("[MongoDB] saveStroke error:", err);
  }
}

export async function saveSticky(roomId: string, sticky: any) {
  try {
    await StickyModel.updateOne(
      { id: sticky.id },
      { $set: { ...sticky, roomId } },
      { upsert: true }
    );
  } catch (err) {
    console.error("[MongoDB] saveSticky error:", err);
  }
}

export async function saveMessage(roomId: string, message: any) {
  try {
    const exists = await MessageModel.findOne({ id: message.id });
    if (!exists) await MessageModel.create({ ...message, roomId });
  } catch (err) {
    console.error("[MongoDB] saveMessage error:", err);
  }
}

export async function loadRoomState(roomId: string) {
  try {
    const [strokes, stickies, messages] = await Promise.all([
      StrokeModel.find({ roomId }).sort({ timestamp: -1 }).limit(500).lean(),
      StickyModel.find({ roomId }).sort({ timestamp: -1 }).limit(100).lean(),
      MessageModel.find({ roomId }).sort({ timestamp: -1 }).limit(100).lean(),
    ]);
    return {
      strokes:  strokes.reverse(),
      stickies: stickies.reverse(),
      messages: messages.reverse(),
    };
  } catch (err) {
    console.error("[MongoDB] loadRoomState error:", err);
    return { strokes: [], stickies: [], messages: [] };
  }
}

export async function clearRoomData(roomId: string) {
  try {
    await Promise.all([
      StrokeModel.deleteMany({ roomId }),
      StickyModel.deleteMany({ roomId }),
    ]);
  } catch (err) {
    console.error("[MongoDB] clearRoomData error:", err);
  }
}

export async function removeSticky(roomId: string, stickyId: string) {
  try {
    await StickyModel.deleteOne({ id: stickyId, roomId });
  } catch (err) {
    console.error("[MongoDB] removeSticky error:", err);
  }
}