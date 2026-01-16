// routes/songs.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createSongSchema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  fileUrl: z.string().url(),
  durationSeconds: z.number().int().positive(),
});

// GET /songs - List all songs (or search)
router.get('/', authenticate, async (req, res) => {
  try {
    const { search } = req.query;
    
    const songs = await prisma.song.findMany({
      where: search ? {
        OR: [
          { title: { contains: search as string, mode: 'insensitive' } },
          { artist: { contains: search as string, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { title: 'asc' },
    });

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

// POST /songs - Create new song entry
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createSongSchema.parse(req.body);

    const song = await prisma.song.create({
      data,
    });

    res.status(201).json({ song });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create song' });
  }
});

export default router;