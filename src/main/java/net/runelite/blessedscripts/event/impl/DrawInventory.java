package net.runelite.blessedscripts.event.impl;

import net.runelite.blessedscripts.botLauncher.BotLite;
import net.runelite.blessedscripts.event.listener.PaintListener;
import net.runelite.blessedscripts.internal.globval.enums.InterfaceTab;
import net.runelite.blessedscripts.methods.MethodContext;
import net.runelite.blessedscripts.wrappers.RSItem;

import java.awt.*;

public class DrawInventory implements PaintListener {

	private final MethodContext ctx;

	public DrawInventory(BotLite bot) {
		ctx = bot.getMethodContext();
	}

	public void onRepaint(final Graphics render) {
		if (!ctx.game.isLoggedIn()) {
			return;
		}

		if (ctx.game.getCurrentTab() != InterfaceTab.INVENTORY) {
			return;
		}

		render.setColor(Color.WHITE);
		final RSItem[] inventoryItems = ctx.inventory.getItems();

		for (RSItem inventoryItem : inventoryItems) {
			if (inventoryItem.getID() != -1) {
				final Point location = new Point (inventoryItem.getItem().getItemLocation().getX(), inventoryItem.getItem().getItemLocation().getY() + 20);
				render.drawString("" + inventoryItem.getID(), location.x, location.y);
			}
		}
	}
}
