package net.runelite.blessedscripts.query.request;

import net.runelite.blessedscripts.wrappers.RSItem;

import java.util.Arrays;
import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSInventoryItemQueryRequest extends QueryRequest<RSItem> {
    public RSInventoryItemQueryRequest() {
        super();
    }

    public List request() {
        return Arrays.asList(methods.inventory.getItems());
    }
}
