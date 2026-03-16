package net.runelite.blessedscripts.internal.globval.enums;


import net.runelite.api.ItemID;
import net.runelite.blessedscripts.internal.globval.GlobalWidgetInfo;
import net.runelite.blessedscripts.wrappers.RSWidget;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public interface Spell
{
    int getLevel();

    RSWidget getWidget();

    boolean canCast();

    public int getBaseHit();

    public class RuneRequirement
    {
        int quantity;
        Rune rune;

        public RuneRequirement(int quantity, Rune rune) {
            this.quantity = quantity;
            this.rune = rune;
        }

        public boolean meetsRequirements()
        {
            return rune.getQuantity() >= quantity;
        }
    }
}
