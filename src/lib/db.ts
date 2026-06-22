// Define the submission data type
export interface SubmissionData {
  businessName: string;
  businessCategory: string;
  productsServices: string;
  businessDescription: string;
  businessStartYear: string;
  businessWorkingHours: string;
  completeAddress: string;
  pincode: string;
  googleMapsLink: string;
  businessMobile: string;
  whatsappNumber: string;
  alternateContact?: string;
  hasBusinessGmail: boolean;
  businessGmail?: string;
  ownerName?: string;
  ownerMobile?: string;
  ownerDOB?: string;
  recoveryMobile?: string;
  gstNumber?: string;
  websiteUrl?: string;
  facebookLink?: string;
  instagramLink?: string;
  upiAvailable: boolean;
  homeDelivery: boolean;
  businessType: 'physical' | 'service';
  images?: any;
  submittedAt: string;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '' || uri.includes('username:password') || uri.includes('your_')) {
    throw new Error('MONGODB_URI is not configured. Please set it in your environment variables.');
  }
  return uri;
}

function getDbName(mongoUri: string): string {
  return mongoUri.split('/').pop()?.split('?')[0] || 'google_setup_db';
}

// Save a new submission to MongoDB
export async function saveSubmission(data: SubmissionData): Promise<{ id: string; dbType: string }> {
  const mongoUri = getMongoUri();

  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(getDbName(mongoUri));
    const collection = db.collection('submissions');

    const res = await collection.insertOne({
      ...data,
      submittedAt: new Date(data.submittedAt),
    });

    const id = res.insertedId.toString();
    console.log(`Saved submission to MongoDB: ${id}`);
    return { id, dbType: 'MongoDB Database' };
  } catch (error) {
    console.error('MongoDB save failed:', error);
    throw new Error('Failed to save submission. Please check your MONGODB_URI and try again.');
  } finally {
    await client.close();
  }
}

// Fetch all submissions from MongoDB
export async function getSubmissions(): Promise<any[]> {
  const mongoUri = getMongoUri();

  const { MongoClient } = await import('mongodb');
  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const db = client.db(getDbName(mongoUri));
    const collection = db.collection('submissions');

    const submissions = await collection.find({}).sort({ submittedAt: -1 }).toArray();

    return submissions.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined,
    }));
  } catch (error) {
    console.error('MongoDB fetch failed:', error);
    throw new Error('Failed to fetch submissions. Please check your MONGODB_URI and try again.');
  } finally {
    await client.close();
  }
}
