import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tickets").order("desc").take(50);
  },
});

export const create = mutation({
  args: {
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const subject = args.subject.trim();
    const description = args.description.trim();

    if (subject.length === 0 || subject.length > 120) {
      throw new ConvexError("Subject must contain 1–120 characters.");
    }

    if (description.length === 0 || description.length > 5000) {
      throw new ConvexError("Description must contain 1–5000 characters.");
    }

    return await ctx.db.insert("tickets", {
      subject,
      description,
      status: "open",
    });
  },
});
