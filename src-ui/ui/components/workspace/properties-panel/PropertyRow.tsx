import { BaseProperty, BooleanPropertyClass, EnumPropertyClass, ImageSourcePropertyClass, NumberPropertyClass, Point2DPropertyClass, StringPropertyClass } from "@/editor/properties/properties";
import { StringPropertyEditor } from "../../property-editor/StringPropertyEditor";
import { SliderPropertyEditor } from "../../property-editor/SliderPropertyEditor";
import { NumberPropertyEditor } from "../../property-editor/NumberPropertyEditor";
import { BooleanPropertyEditor } from "../../property-editor/BooleanPropertyEditor";
import { EnumPropertyEditor } from "../../property-editor/EnumPropertyEditor";
import { Point2DPropertyEditor } from "../../property-editor/Point2DPropertyEditor";
import { ImageSourcePropertyEditor } from "../../property-editor/ImageSourcePropertyEditor";

type PropertyRowProps = {
    property: BaseProperty<any>;
}
export default function PropertyRow({ property }: PropertyRowProps) {
    if (property instanceof StringPropertyClass) {
        return <StringPropertyEditor key={property.id} property={property} />
    } else if (property instanceof NumberPropertyClass) {
        if (property.slider) {
            return <SliderPropertyEditor key={property.id} property={property} slider={property.slider} />
        } else {
            return <NumberPropertyEditor key={property.id} property={property} />
        }
    } else if (property instanceof BooleanPropertyClass) {
        return <BooleanPropertyEditor key={property.id} property={property} />
    } else if (property instanceof EnumPropertyClass) {
        return <EnumPropertyEditor key={property.id} property={property} />
    } else if (property instanceof Point2DPropertyClass) {
        return <Point2DPropertyEditor key={property.id} property={property} />
    } else if (property instanceof ImageSourcePropertyClass) {
        return <ImageSourcePropertyEditor key={property.id} property={property} />
    }
    return null;
}
