import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { genId } from '../id';
import { users } from './auth';

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    servings: integer('servings'),
    totalMinutes: integer('total_minutes'),
    instructions: text('instructions'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({ userIdx: index('recipes_user_idx').on(t.userId) }),
);

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    id: uuid('id').primaryKey().$defaultFn(genId),
    recipeId: uuid('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    quantity: text('quantity'),
    position: integer('position').notNull().default(0),
  },
  (t) => ({ recipeIdx: index('recipe_ingredients_recipe_idx').on(t.recipeId, t.position) }),
);

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredients.$inferInsert;
