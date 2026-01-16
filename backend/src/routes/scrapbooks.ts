// routes/scrapbooks.ts

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createScrapbookSchema = z.object({
  title: z.string().min(1).max(200),
  themeCategory: z.string(),
  isPrivate: z.boolean().default(false),
});

const updateScrapbookSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  themeCategory: z.string().optional(),
  isPrivate: z.boolean().optional(),
});

const createPageSchema = z.object({
  scrapbookId: z.string().uuid(),
  pageOrder: z.number().int().min(0),
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().url().optional(),
});

const createElementSchema = z.object({
  type: z.enum(['photo', 'sticker', 'text']),
  xPos: z.number(),
  yPos: z.number(),
  rotation: z.number().default(0),
  scale: z.number().positive().default(1),
  zIndex: z.number().int(),
  properties: z.record(z.any()),
});

// GET /scrapbooks - List user's scrapbooks
router.get('/', authenticate, async (req, res) => {
  try {
    const scrapbooks = await prisma.scrapbook.findMany({
      where: { userId: req.user!.id },
      include: {
        pages: {
          take: 1,
          orderBy: { pageOrder: 'asc' },
        },
        songs: {
          include: { song: true },
        },
        _count: {
          select: { pages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ scrapbooks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scrapbooks' });
  }
});

// GET /scrapbooks/:id - Get single scrapbook with all pages
router.get('/:id', authenticate, async (req, res) => {
  try {
    const scrapbook = await prisma.scrapbook.findUnique({
      where: { id: req.params.id },
      include: {
        pages: {
          include: {
            elements: {
              orderBy: { zIndex: 'asc' },
            },
          },
          orderBy: { pageOrder: 'asc' },
        },
        songs: {
          include: { song: true },
        },
      },
    });

    if (!scrapbook) {
      return res.status(404).json({ error: 'Scrapbook not found' });
    }

    // Check access permissions
    if (scrapbook.isPrivate && scrapbook.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ scrapbook });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scrapbook' });
  }
});

// POST /scrapbooks - Create new scrapbook
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createScrapbookSchema.parse(req.body);

    const scrapbook = await prisma.scrapbook.create({
      data: {
        ...data,
        userId: req.user!.id,
      },
    });

    res.status(201).json({ scrapbook });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create scrapbook' });
  }
});

// PATCH /scrapbooks/:id - Update scrapbook
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const data = updateScrapbookSchema.parse(req.body);

    const scrapbook = await prisma.scrapbook.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.id, // Ensure ownership
      },
      data,
    });

    if (scrapbook.count === 0) {
      return res.status(404).json({ error: 'Scrapbook not found or access denied' });
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update scrapbook' });
  }
});

// DELETE /scrapbooks/:id - Delete scrapbook
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const deleted = await prisma.scrapbook.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Scrapbook not found or access denied' });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete scrapbook' });
  }
});

// POST /scrapbooks/:id/songs - Add song to scrapbook
router.post('/:id/songs', authenticate, async (req, res) => {
  try {
    const { songId } = z.object({ songId: z.string().uuid() }).parse(req.body);

    // Verify scrapbook ownership
    const scrapbook = await prisma.scrapbook.findUnique({
      where: { id: req.params.id },
    });

    if (!scrapbook || scrapbook.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.scrapbookSong.create({
      data: {
        scrapbookId: req.params.id,
        songId,
      },
    });

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add song' });
  }
});

// POST /scrapbooks/:id/pages - Create new page
router.post('/:id/pages', authenticate, async (req, res) => {
  try {
    const data = createPageSchema.parse(req.body);

    // Verify ownership
    const scrapbook = await prisma.scrapbook.findUnique({
      where: { id: req.params.id },
    });

    if (!scrapbook || scrapbook.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const page = await prisma.page.create({
      data: {
        scrapbookId: req.params.id,
        pageOrder: data.pageOrder,
        backgroundColor: data.backgroundColor,
        backgroundImageUrl: data.backgroundImageUrl,
      },
    });

    res.status(201).json({ page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// PUT /pages/:pageId - Update entire page layout
router.put('/pages/:pageId', authenticate, async (req, res) => {
  try {
    const { elements, ...pageData } = req.body;

    // Verify ownership through scrapbook
    const page = await prisma.page.findUnique({
      where: { id: req.params.pageId },
      include: { scrapbook: true },
    });

    if (!page || page.scrapbook.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Use transaction to update page and elements atomically
    await prisma.$transaction(async (tx) => {
      // Update page properties
      if (pageData.backgroundColor !== undefined || pageData.backgroundImageUrl !== undefined) {
        await tx.page.update({
          where: { id: req.params.pageId },
          data: {
            backgroundColor: pageData.backgroundColor,
            backgroundImageUrl: pageData.backgroundImageUrl,
          },
        });
      }

      // Delete existing elements and create new ones
      if (elements) {
        await tx.pageElement.deleteMany({
          where: { pageId: req.params.pageId },
        });

        await tx.pageElement.createMany({
          data: elements.map((el: any) => ({
            ...createElementSchema.parse(el),
            pageId: req.params.pageId,
          })),
        });
      }
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// POST /pages/:pageId/elements - Add element to page
router.post('/pages/:pageId/elements', authenticate, async (req, res) => {
  try {
    const data = createElementSchema.parse(req.body);

    // Verify ownership
    const page = await prisma.page.findUnique({
      where: { id: req.params.pageId },
      include: { scrapbook: true },
    });

    if (!page || page.scrapbook.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const element = await prisma.pageElement.create({
      data: {
        ...data,
        pageId: req.params.pageId,
      },
    });

    res.status(201).json({ element });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create element' });
  }
});

export default router;