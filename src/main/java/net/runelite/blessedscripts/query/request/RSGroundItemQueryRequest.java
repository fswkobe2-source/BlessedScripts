package net.runelite.blessedscripts.query.request;

import net.runelite.blessedscripts.wrappers.RSGroundItem;

import java.util.Arrays;
import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSGroundItemQueryRequest extends PositionableQueryRequest<RSGroundItem> {
    public RSGroundItemQueryRequest() {
        super(52);
    }

    public List request() {
        return Arrays.asList(methods.groundItems.getAll());
    }
}
