const validUrl = require('valid-url');
const Counter = require('../models/Counter');
const Link = require('../models/Link');
const { encode } = require('../utils/base62');
const Click = require('../models/Click');

// Create short link
exports.createLink = async (req, res) => {
  try {
    const { originalURL ,expiresInDays} = req.body;

    if (!originalURL) {
      return res.status(400).json({ message: 'URL is required' });
    }

    if (!validUrl.isWebUri(originalURL)) {
      return res.status(400).json({ message: 'Invalid URL' });
    }

    // Get next sequence number
    const seq = await Counter.getNextSequence('linkCounter');

    // Convert to Base62
    const shortCode = encode(seq);

    let expiresAt = null;

    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + Number(expiresInDays));
    }

    // Save link
    const link = await Link.create({
      shortCode,
      originalURL,
      user: req.user._id,
      expiresAt,
    });

    res.status(201).json({
      shortURL: `${process.env.BASE_URL}/${shortCode}`,
      originalURL: link.originalURL,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.redirectToURL = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const link = await Link.findOne({ shortCode });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    if (!link.isActive) {
      return res.status(400).json({ message: 'Link is inactive' });
    }

    if (link.expiresAt && link.expiresAt < Date.now()) {
      return res.status(400).json({ message: 'Link expired' });
    }

    // 🚀 Redirect immediately
    res.redirect(302, link.originalURL);

    // 📊 Save click event asynchronously
    Click.create({
      link: link._id,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    // ⚡ Increment total click counter (fast lookup)
    Link.updateOne(
      { _id: link._id },
      { $inc: { clicks: 1 } }
    ).catch(() => {});

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all links for logged-in user
exports.getUserLinks = async (req, res) => {
  try {
    const links = await Link.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(links);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get analytics for a specific link
exports.getLinkAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await Link.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Aggregate clicks per day
    const clicksPerDay = await Click.aggregate([
      { $match: { link: link._id } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      shortCode: link.shortCode,
      originalURL: link.originalURL,
      totalClicks: link.clicks,
      clicksPerDay,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle link active status
exports.toggleLinkStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await Link.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    link.isActive = !link.isActive;
    await link.save();

    res.json({
      message: `Link is now ${link.isActive ? 'active' : 'inactive'}`,
      isActive: link.isActive,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete link
exports.deleteLink = async (req, res) => {
  try {
    const { id } = req.params;

    const link = await Link.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    // Remove associated click records
    await Click.deleteMany({ link: link._id });

    // Delete link
    await link.deleteOne();

    res.json({ message: 'Link deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};