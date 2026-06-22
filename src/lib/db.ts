import fs from 'fs/promises';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const JSON_FILE_PATH = path.join(DATA_DIR, 'submissions.json');

// Check if a connection string is a placeholder
function isPlaceholder(uri: string | undefined): boolean {
  if (!uri) return true;
  return (
    uri.includes('username:password') ||
    uri.includes('your_') ||
    uri.trim() === ''
  );
}

// Fallback: Save to JSON file
async function saveToJsonFile(data: SubmissionData): Promise<{ id: string; dbType: string }> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    let submissions: any[] = [];
    try {
      const fileContent = await fs.readFile(JSON_FILE_PATH, 'utf-8');
      submissions = JSON.parse(fileContent);
    } catch (err) {
      // File doesn't exist or is empty
      submissions = [];
    }

    const id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const record = { id, ...data };
    submissions.push(record);

    await fs.writeFile(JSON_FILE_PATH, JSON.stringify(submissions, null, 2), 'utf-8');
    console.log(`Saved submission locally to JSON: ${id}`);
    return { id, dbType: 'Local JSON File' };
  } catch (error) {
    console.error('Failed to save to local JSON file:', error);
    throw error;
  }
}

// PostgreSQL integration
async function saveToPostgreSQL(dbUrl: string, data: SubmissionData): Promise<{ id: string; dbType: string } | null> {
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        business_name VARCHAR(255) NOT NULL,
        business_category VARCHAR(255) NOT NULL,
        products_services TEXT,
        business_description TEXT,
        business_start_year VARCHAR(10),
        business_working_hours VARCHAR(100),
        complete_address TEXT,
        pincode VARCHAR(20),
        google_maps_link TEXT,
        business_mobile VARCHAR(20),
        whatsapp_number VARCHAR(20),
        alternate_contact VARCHAR(20),
        has_business_gmail BOOLEAN,
        business_gmail VARCHAR(255),
        owner_name VARCHAR(255),
        owner_mobile VARCHAR(20),
        owner_dob VARCHAR(20),
        recovery_mobile VARCHAR(20),
        gst_number VARCHAR(50),
        website_url TEXT,
        facebook_link TEXT,
        instagram_link TEXT,
        upi_available BOOLEAN,
        home_delivery BOOLEAN,
        business_type VARCHAR(20),
        images JSONB,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert statement
    const query = `
      INSERT INTO submissions (
        business_name, business_category, products_services, business_description,
        business_start_year, business_working_hours, complete_address, pincode,
        google_maps_link, business_mobile, whatsapp_number, alternate_contact,
        has_business_gmail, business_gmail, owner_name, owner_mobile, owner_dob,
        recovery_mobile, gst_number, website_url, facebook_link, instagram_link,
        upi_available, home_delivery, business_type, images, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      RETURNING id;
    `;

    const values = [
      data.businessName,
      data.businessCategory,
      data.productsServices,
      data.businessDescription,
      data.businessStartYear,
      data.businessWorkingHours,
      data.completeAddress,
      data.pincode,
      data.googleMapsLink,
      data.businessMobile,
      data.whatsappNumber,
      data.alternateContact || null,
      data.hasBusinessGmail,
      data.businessGmail || null,
      data.ownerName || null,
      data.ownerMobile || null,
      data.ownerDOB || null,
      data.recoveryMobile || null,
      data.gstNumber || null,
      data.websiteUrl || null,
      data.facebookLink || null,
      data.instagramLink || null,
      data.upiAvailable,
      data.homeDelivery,
      data.businessType,
      JSON.stringify(data.images),
      data.submittedAt
    ];

    const res = await client.query(query, values);
    const id = res.rows[0].id.toString();
    await client.end();
    
    console.log(`Saved submission to PostgreSQL: ${id}`);
    return { id, dbType: 'PostgreSQL Database' };
  } catch (error) {
    console.error('PostgreSQL Save Failed, attempting fallback:', error);
    return null; // Signals we need fallback
  }
}

// MongoDB integration
async function saveToMongoDB(mongoUri: string, data: SubmissionData): Promise<{ id: string; dbType: string } | null> {
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(mongoUri);
    await client.connect();

    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'google_setup_db';
    const db = client.db(dbName);
    const collection = db.collection('submissions');

    const res = await collection.insertOne({
      ...data,
      submittedAt: new Date(data.submittedAt)
    });

    const id = res.insertedId.toString();
    await client.close();

    console.log(`Saved submission to MongoDB: ${id}`);
    return { id, dbType: 'MongoDB Database' };
  } catch (error) {
    console.error('MongoDB Save Failed, attempting fallback:', error);
    return null; // Signals we need fallback
  }
}

// Main save submission controller
export async function saveSubmission(data: SubmissionData): Promise<{ id: string; dbType: string }> {
  const pgUrl = process.env.DATABASE_URL;
  const mongoUri = process.env.MONGODB_URI;

  // Try MongoDB if configured
  if (!isPlaceholder(mongoUri)) {
    const res = await saveToMongoDB(mongoUri!, data);
    if (res) return res;
  }

  // Try PostgreSQL if configured
  if (!isPlaceholder(pgUrl)) {
    const res = await saveToPostgreSQL(pgUrl!, data);
    if (res) return res;
  }

  // Fallback to local JSON file
  return await saveToJsonFile(data);
}

// Fetch submissions from MongoDB
async function getFromMongoDB(mongoUri: string): Promise<any[]> {
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(mongoUri);
    await client.connect();

    const dbName = mongoUri.split('/').pop()?.split('?')[0] || 'google_setup_db';
    const db = client.db(dbName);
    const collection = db.collection('submissions');

    const submissions = await collection.find({}).sort({ submittedAt: -1 }).toArray();
    
    // Map _id object to string for ease of use
    const mapped = submissions.map(doc => ({
      ...doc,
      id: doc._id.toString(),
      _id: undefined
    }));

    await client.close();
    return mapped;
  } catch (error) {
    console.error('Failed to get from MongoDB:', error);
    throw error;
  }
}

// Fetch submissions from PostgreSQL
async function getFromPostgreSQL(dbUrl: string): Promise<any[]> {
  try {
    const { Client } = await import('pg');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    const res = await client.query('SELECT * FROM submissions ORDER BY submitted_at DESC');
    await client.end();

    return res.rows.map(row => ({
      id: row.id.toString(),
      businessName: row.business_name,
      businessCategory: row.business_category,
      productsServices: row.products_services,
      businessDescription: row.business_description,
      businessStartYear: row.business_start_year,
      businessWorkingHours: row.business_working_hours,
      completeAddress: row.complete_address,
      pincode: row.pincode,
      googleMapsLink: row.google_maps_link,
      businessMobile: row.business_mobile,
      whatsappNumber: row.whatsapp_number,
      alternateContact: row.alternate_contact,
      hasBusinessGmail: row.has_business_gmail,
      businessGmail: row.business_gmail,
      ownerName: row.owner_name,
      ownerMobile: row.owner_mobile,
      ownerDOB: row.owner_dob,
      recoveryMobile: row.recovery_mobile,
      gstNumber: row.gst_number,
      websiteUrl: row.website_url,
      facebookLink: row.facebook_link,
      instagramLink: row.instagram_link,
      upiAvailable: row.upi_available,
      homeDelivery: row.home_delivery,
      businessType: row.business_type,
      images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images,
      submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : null
    }));
  } catch (error) {
    console.error('Failed to get from PostgreSQL:', error);
    throw error;
  }
}

// Fetch submissions from JSON File fallback
async function getFromJsonFile(): Promise<any[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const fileContent = await fs.readFile(JSON_FILE_PATH, 'utf-8');
      const data = JSON.parse(fileContent);
      // Sort newest first
      return data.sort((a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } catch (err) {
      return [];
    }
  } catch (error) {
    console.error('Failed to read local JSON submissions:', error);
    return [];
  }
}

export async function getSubmissions(): Promise<any[]> {
  const pgUrl = process.env.DATABASE_URL;
  const mongoUri = process.env.MONGODB_URI;

  if (!isPlaceholder(mongoUri)) {
    try {
      return await getFromMongoDB(mongoUri!);
    } catch (e) {
      console.warn('MongoDB query failed, falling back to local storage.');
    }
  }

  if (!isPlaceholder(pgUrl)) {
    try {
      return await getFromPostgreSQL(pgUrl!);
    } catch (e) {
      console.warn('PostgreSQL query failed, falling back to local storage.');
    }
  }

  return await getFromJsonFile();
}
