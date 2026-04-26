export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "staff" | "customer";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: "admin" | "staff" | "customer";
          created_at?: string;
        };
        Update: {
          role?: "admin" | "staff" | "customer";
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          short_description: string | null;
          description: string | null;
          sku: string | null;
          nutrition_serving_size: string | null;
          nutrition_servings_per_container: string | null;
          nutrition_facts: Json | null;
          allergen_statement: string | null;
          base_price: number;
          featured: boolean;
          seasonal: boolean;
          stock_quantity: number | null;
          lead_time_days: number;
          status: "active" | "draft" | "archived";
          pickup_only: boolean;
          delivery_available: boolean;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          short_description?: string | null;
          description?: string | null;
          sku?: string | null;
          nutrition_serving_size?: string | null;
          nutrition_servings_per_container?: string | null;
          nutrition_facts?: Json | null;
          allergen_statement?: string | null;
          base_price: number;
          featured?: boolean;
          seasonal?: boolean;
          stock_quantity?: number | null;
          lead_time_days?: number;
          status?: "active" | "draft" | "archived";
          pickup_only?: boolean;
          delivery_available?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          short_description?: string | null;
          description?: string | null;
          sku?: string | null;
          nutrition_serving_size?: string | null;
          nutrition_servings_per_container?: string | null;
          nutrition_facts?: Json | null;
          allergen_statement?: string | null;
          base_price?: number;
          featured?: boolean;
          seasonal?: boolean;
          stock_quantity?: number | null;
          lead_time_days?: number;
          status?: "active" | "draft" | "archived";
          pickup_only?: boolean;
          delivery_available?: boolean;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          quantity: number;
          price: number;
          option_value: string;
          price_delta: number;
          is_default: boolean;
          stock_quantity: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          quantity: number;
          price: number;
          option_value?: string;
          price_delta?: number;
          is_default?: boolean;
          stock_quantity?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          quantity?: number;
          price?: number;
          option_value?: string;
          price_delta?: number;
          is_default?: boolean;
          stock_quantity?: number | null;
          sort_order?: number;
        };
      };
      product_addons: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          description: string | null;
          price: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          minimum_order_amount: number | null;
          starts_at: string | null;
          ends_at: string | null;
          usage_limit: number | null;
          usage_count: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          minimum_order_amount?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          minimum_order_amount?: number | null;
          starts_at?: string | null;
          ends_at?: string | null;
          usage_limit?: number | null;
          usage_count?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          status:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "ready"
            | "delivered"
            | "canceled";
          fulfillment_method: "pickup" | "delivery";
          fulfillment_date: string;
          fulfillment_time_slot: string | null;
          notes: string | null;
          subtotal: number;
          discount_total: number;
          delivery_fee: number;
          tax_total: number;
          total: number;
          coupon_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          shipping_address: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          status?:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "ready"
            | "delivered"
            | "canceled";
          fulfillment_method: "pickup" | "delivery";
          fulfillment_date: string;
          fulfillment_time_slot?: string | null;
          notes?: string | null;
          subtotal: number;
          discount_total?: number;
          delivery_fee?: number;
          tax_total?: number;
          total: number;
          coupon_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          shipping_address?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          order_number?: string;
          user_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          status?:
            | "pending"
            | "confirmed"
            | "in_progress"
            | "ready"
            | "delivered"
            | "canceled";
          fulfillment_method?: "pickup" | "delivery";
          fulfillment_date?: string;
          fulfillment_time_slot?: string | null;
          notes?: string | null;
          subtotal?: number;
          discount_total?: number;
          delivery_fee?: number;
          tax_total?: number;
          total?: number;
          coupon_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          shipping_address?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          unit_price: number;
          quantity: number;
          addons: Json | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          unit_price: number;
          quantity: number;
          addons?: Json | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string;
          variant_name?: string | null;
          unit_price?: number;
          quantity?: number;
          addons?: Json | null;
          image_url?: string | null;
        };
      };
      custom_orders: {
        Row: {
          id: string;
          customer_name: string;
          phone: string;
          email: string;
          event_type: string;
          event_date: string;
          quantity: string;
          budget: number | null;
          colors_theme: string | null;
          description: string;
          inspiration_image_url: string | null;
          notes: string | null;
          status:
            | "new"
            | "reviewing"
            | "quoted"
            | "approved"
            | "declined"
            | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          phone: string;
          email: string;
          event_type: string;
          event_date: string;
          quantity: string;
          budget?: number | null;
          colors_theme?: string | null;
          description: string;
          inspiration_image_url?: string | null;
          notes?: string | null;
          status?:
            | "new"
            | "reviewing"
            | "quoted"
            | "approved"
            | "declined"
            | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_name?: string;
          phone?: string;
          email?: string;
          event_type?: string;
          event_date?: string;
          quantity?: string;
          budget?: number | null;
          colors_theme?: string | null;
          description?: string;
          inspiration_image_url?: string | null;
          notes?: string | null;
          status?:
            | "new"
            | "reviewing"
            | "quoted"
            | "approved"
            | "declined"
            | "completed";
          created_at?: string;
          updated_at?: string;
        };
      };
      testimonials: {
        Row: {
          id: string;
          customer_name: string;
          rating: number;
          quote: string;
          occasion: string | null;
          featured: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          rating?: number;
          quote: string;
          occasion?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_name?: string;
          rating?: number;
          quote?: string;
          occasion?: string | null;
          featured?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      homepage_content: {
        Row: {
          id: string;
          banner_text: string | null;
          banner_cta_label: string | null;
          banner_cta_href: string | null;
          seo_title: string | null;
          seo_description: string | null;
          hero_eyebrow: string | null;
          hero_title: string | null;
          hero_description: string | null;
          hero_primary_cta_label: string | null;
          hero_primary_cta_href: string | null;
          hero_secondary_cta_label: string | null;
          hero_secondary_cta_href: string | null;
          hero_image_url: string | null;
          hero_image_alt: string | null;
          hero_mobile_image_url: string | null;
          hero_mobile_image_alt: string | null;
          hero_background_image_url: string | null;
          hero_background_image_alt: string | null;
          featured_heading: string | null;
          featured_description: string | null;
          process_heading: string | null;
          process_description: string | null;
          testimonials_heading: string | null;
          testimonials_description: string | null;
          cta_heading: string | null;
          cta_description: string | null;
          content_json: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          banner_text?: string | null;
          banner_cta_label?: string | null;
          banner_cta_href?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          hero_eyebrow?: string | null;
          hero_title?: string | null;
          hero_description?: string | null;
          hero_primary_cta_label?: string | null;
          hero_primary_cta_href?: string | null;
          hero_secondary_cta_label?: string | null;
          hero_secondary_cta_href?: string | null;
          hero_image_url?: string | null;
          hero_image_alt?: string | null;
          hero_mobile_image_url?: string | null;
          hero_mobile_image_alt?: string | null;
          hero_background_image_url?: string | null;
          hero_background_image_alt?: string | null;
          featured_heading?: string | null;
          featured_description?: string | null;
          process_heading?: string | null;
          process_description?: string | null;
          testimonials_heading?: string | null;
          testimonials_description?: string | null;
          cta_heading?: string | null;
          cta_description?: string | null;
          content_json?: Json | null;
          updated_at?: string;
        };
        Update: {
          banner_text?: string | null;
          banner_cta_label?: string | null;
          banner_cta_href?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          hero_eyebrow?: string | null;
          hero_title?: string | null;
          hero_description?: string | null;
          hero_primary_cta_label?: string | null;
          hero_primary_cta_href?: string | null;
          hero_secondary_cta_label?: string | null;
          hero_secondary_cta_href?: string | null;
          hero_image_url?: string | null;
          hero_image_alt?: string | null;
          hero_mobile_image_url?: string | null;
          hero_mobile_image_alt?: string | null;
          hero_background_image_url?: string | null;
          hero_background_image_alt?: string | null;
          featured_heading?: string | null;
          featured_description?: string | null;
          process_heading?: string | null;
          process_description?: string | null;
          testimonials_heading?: string | null;
          testimonials_description?: string | null;
          cta_heading?: string | null;
          cta_description?: string | null;
          content_json?: Json | null;
          updated_at?: string;
        };
      };
      seasonal_specials: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          description: string | null;
          cta_label: string | null;
          cta_href: string | null;
          image_url: string | null;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          description?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_url?: string | null;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          description?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_url?: string | null;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      site_settings: {
        Row: {
          id: string;
          business_name: string;
          tagline: string | null;
          support_email: string | null;
          support_phone: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          tiktok_url: string | null;
          address: string | null;
          business_hours: Json | null;
          delivery_zones: Json | null;
          pickup_instructions: string | null;
          free_delivery_threshold: number | null;
          currency: string;
          payment_settings: Json | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          tagline?: string | null;
          support_email?: string | null;
          support_phone?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          address?: string | null;
          business_hours?: Json | null;
          delivery_zones?: Json | null;
          pickup_instructions?: string | null;
          free_delivery_threshold?: number | null;
          currency?: string;
          payment_settings?: Json | null;
          updated_at?: string;
        };
        Update: {
          business_name?: string;
          tagline?: string | null;
          support_email?: string | null;
          support_phone?: string | null;
          instagram_url?: string | null;
          facebook_url?: string | null;
          tiktok_url?: string | null;
          address?: string | null;
          business_hours?: Json | null;
          delivery_zones?: Json | null;
          pickup_instructions?: string | null;
          free_delivery_threshold?: number | null;
          currency?: string;
          payment_settings?: Json | null;
          updated_at?: string;
        };
      };
      media_assets: {
        Row: {
          id: string;
          file_name: string;
          storage_path: string;
          public_url: string | null;
          alt_text: string | null;
          bucket: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          storage_path: string;
          public_url?: string | null;
          alt_text?: string | null;
          bucket?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: {
          file_name?: string;
          storage_path?: string;
          public_url?: string | null;
          alt_text?: string | null;
          bucket?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableName = keyof Database["public"]["Tables"];
