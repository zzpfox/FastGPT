import { connectionMongo, type Model } from '../../mongo';
const { Schema, model, models } = connectionMongo;
import { RawTextBufferSchemaType } from './type';

export const collectionName = 'buffer.rawText';

const RawTextBufferSchema = new Schema({
  sourceId: {
    type: String,
    required: true
  },
  rawText: {
    type: String,
    default: ''
  },
  createTime: {
    type: Date,
    default: () => new Date()
  },
  metadata: Object
});

try {
  RawTextBufferSchema.index({ sourceId: 1 });
  //  20 minutes
  RawTextBufferSchema.index({ createTime: 1 }, { expireAfterSeconds: 20 * 60 });
} catch (error) {
  console.log(error);
}

export const MongoRwaTextBuffer: Model<RawTextBufferSchemaType> =
  models[collectionName] || model(collectionName, RawTextBufferSchema);
MongoRwaTextBuffer.syncIndexes();
