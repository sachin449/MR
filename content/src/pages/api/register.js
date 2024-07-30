// src/pages/api/register.js
import { hashPassword } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

const toHexadecimal = (str) => {
  return Buffer.from(str, 'utf8').toString('hex');
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await clientPromise;
    const db = client.db();

    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      return res.status(422).json({ message: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const ouid = toHexadecimal(password);
    const role = 'borrower'; // Default role

    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      ouid,
      role, // Assign default role
    });

    res.status(201).json({ message: 'User created', userId: result.insertedId, role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
