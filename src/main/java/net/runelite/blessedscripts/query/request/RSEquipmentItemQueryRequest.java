package net.runelite.blessedscripts.query.request;

import net.runelite.blessedscripts.wrappers.RSItem;

import java.util.Arrays;
import java.util.List;

import static net.runelite.blessedscripts.methods.MethodProvider.methods;

public class RSEquipmentItemQueryRequest extends QueryRequest<RSItem> {
    public RSEquipmentItemQueryRequest() { super(); }

    @Override
    public List<RSItem> request() {
        return Arrays.asList(methods.equipment.getItems());
    }
}
