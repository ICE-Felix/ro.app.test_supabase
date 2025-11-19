export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          active: boolean | null
          banner_image_id: string | null
          click_counter: number | null
          created_at: string
          deleted_at: string | null
          display_counter: number | null
          end_date: string | null
          id: string
          link: string | null
          name: string | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          active?: boolean | null
          banner_image_id?: string | null
          click_counter?: number | null
          created_at?: string
          deleted_at?: string | null
          display_counter?: number | null
          end_date?: string | null
          id?: string
          link?: string | null
          name?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          active?: boolean | null
          banner_image_id?: string | null
          click_counter?: number | null
          created_at?: string
          deleted_at?: string | null
          display_counter?: number | null
          end_date?: string | null
          id?: string
          link?: string | null
          name?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banners_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone_no: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone_no?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone_no?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          comment: string | null
          created_at: string
          deleted_at: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          number: string | null
          partner_id: string | null
          type_id: string | null
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          number?: string | null
          partner_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          deleted_at?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          number?: string | null
          partner_id?: string | null
          type_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "contract_types"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean | null
          code: string | null
          created_at: string
          deleted_at: string | null
          discount: string | null
          id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          discount?: string | null
          id?: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string | null
          created_at?: string
          deleted_at?: string | null
          discount?: string | null
          id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_schedule: {
        Row: {
          created_at: string
          deleted_at: string | null
          ends_on: string
          event_id: string
          frequency: Database["public"]["Enums"]["frequency_enum"]
          id: string
          monthly_days: number | null
          starts_on: string
          updated_at: string | null
          weekly_days: number | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          ends_on: string
          event_id?: string
          frequency: Database["public"]["Enums"]["frequency_enum"]
          id?: string
          monthly_days?: number | null
          starts_on: string
          updated_at?: string | null
          weekly_days?: number | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          ends_on?: string
          event_id?: string
          frequency?: Database["public"]["Enums"]["frequency_enum"]
          id?: string
          monthly_days?: number | null
          starts_on?: string
          updated_at?: string | null
          weekly_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_types: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          age: Json | null
          agenda: string | null
          capacity: string | null
          contact_person: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string | null
          end: string | null
          event_image_id: string | null
          event_type_id: string | null
          id: string
          location_latitude: string | null
          location_longitude: string | null
          phone_no: string | null
          price: string | null
          schedule_type: string | null
          start: string | null
          status: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          address?: string | null
          age?: Json | null
          agenda?: string | null
          capacity?: string | null
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          end?: string | null
          event_image_id?: string | null
          event_type_id?: string | null
          id?: string
          location_latitude?: string | null
          location_longitude?: string | null
          phone_no?: string | null
          price?: string | null
          schedule_type?: string | null
          start?: string | null
          status?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          address?: string | null
          age?: Json | null
          agenda?: string | null
          capacity?: string | null
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          end?: string | null
          event_image_id?: string | null
          event_type_id?: string | null
          id?: string
          location_latitude?: string | null
          location_longitude?: string | null
          phone_no?: string | null
          price?: string | null
          schedule_type?: string | null
          start?: string | null
          status?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_event_type_id_fkey"
            columns: ["event_type_id"]
            isOneToOne: false
            referencedRelation: "event_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      galleries: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          name: string | null
          updated_at: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galleries_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          display_order: number | null
          file_name: string
          file_path: string
          file_size: number
          gallery_id: string | null
          id: string
          is_primary: boolean | null
          mime_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          file_name: string
          file_path: string
          file_size: number
          gallery_id?: string | null
          id?: string
          is_primary?: boolean | null
          mime_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          display_order?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          gallery_id?: string | null
          id?: string
          is_primary?: boolean | null
          mime_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      locale: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          id: string
          label: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menus: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          label: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          label?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          label?: string | null
        }
        Relationships: []
      }
      menus_options: {
        Row: {
          active: boolean
          category_title: string | null
          created_at: string
          href: string
          icon: string | null
          id: string
          label: string | null
          menu_id: string | null
          parent_id: string | null
          priority: number | null
        }
        Insert: {
          active?: boolean
          category_title?: string | null
          created_at?: string
          href?: string
          icon?: string | null
          id?: string
          label?: string | null
          menu_id?: string | null
          parent_id?: string | null
          priority?: number | null
        }
        Update: {
          active?: boolean
          category_title?: string | null
          created_at?: string
          href?: string
          icon?: string | null
          id?: string
          label?: string | null
          menu_id?: string | null
          parent_id?: string | null
          priority?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menus_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_options_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body: string | null
          created_at: string
          deleted_at: string | null
          id: string
          image_featured_id: string | null
          keywords: string | null
          likes: number | null
          locale_id: string | null
          news_categories_id: string
          partner_id: string
          read_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_featured_id?: string | null
          keywords?: string | null
          likes?: number | null
          locale_id?: string | null
          news_categories_id?: string
          partner_id: string
          read_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_featured_id?: string | null
          keywords?: string | null
          likes?: number | null
          locale_id?: string | null
          news_categories_id?: string
          partner_id?: string
          read_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_categories_id_fkey"
            columns: ["news_categories_id"]
            isOneToOne: false
            referencedRelation: "news_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      news_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          id: string
          is_global: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_global?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          is_global?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      occurrence: {
        Row: {
          created_at: string
          deleted_at: string | null
          event_id: string | null
          id: string
          schedule_id: string | null
          status: Database["public"]["Enums"]["occurrence_status_enum"] | null
          updated_at: string | null
          window_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          id?: string
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["occurrence_status_enum"] | null
          updated_at?: string | null
          window_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          id?: string
          schedule_id?: string | null
          status?: Database["public"]["Enums"]["occurrence_status_enum"] | null
          updated_at?: string | null
          window_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "event_schedule"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_window_id_fkey"
            columns: ["window_id"]
            isOneToOne: false
            referencedRelation: "schedule_time_window"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          administrator_contact_id: string | null
          bank_account: string | null
          bank_name: string | null
          business_email: string | null
          company_name: string
          created_at: string | null
          deleted_at: string | null
          id: string
          is_active: boolean | null
          orders_email: string | null
          phone_number: string | null
          registration_number: string | null
          tax_id: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          administrator_contact_id?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_email?: string | null
          company_name: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          orders_email?: string | null
          phone_number?: string | null
          registration_number?: string | null
          tax_id: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          administrator_contact_id?: string | null
          bank_account?: string | null
          bank_name?: string | null
          business_email?: string | null
          company_name?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_active?: boolean | null
          orders_email?: string | null
          phone_number?: string | null
          registration_number?: string | null
          tax_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_administrator_contact_id_fkey"
            columns: ["administrator_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          actions: string | null
          id: number
          role_id: number | null
          table_name: string | null
        }
        Insert: {
          actions?: string | null
          id?: number
          role_id?: number | null
          table_name?: string | null
        }
        Update: {
          actions?: string | null
          id?: number
          role_id?: number | null
          table_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country_id: string
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      schedule_time_window: {
        Row: {
          created_at: string
          date: string | null
          deleted_at: string | null
          end_time: string
          id: string
          schedule_id: string | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          end_time: string
          id?: string
          schedule_id?: string | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          end_time?: string
          id?: string
          schedule_id?: string | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_time_window_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "event_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          id: string
          partner_id: string
          updated_at: string
          woo_shop_id: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          partner_id: string
          updated_at?: string
          woo_shop_id?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          id?: string
          partner_id?: string
          updated_at?: string
          woo_shop_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shops_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_eligibility: {
        Row: {
          created_at: string
          deleted_at: string | null
          frequency: Database["public"]["Enums"]["frequency_enum"][] | null
          id: string
          monthly_days: number[] | null
          schedule_id: string | null
          ticket_type_id: string | null
          updated_at: string | null
          weekly_days: number[] | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"][] | null
          id?: string
          monthly_days?: number[] | null
          schedule_id?: string | null
          ticket_type_id?: string | null
          updated_at?: string | null
          weekly_days?: number[] | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          frequency?: Database["public"]["Enums"]["frequency_enum"][] | null
          id?: string
          monthly_days?: number[] | null
          schedule_id?: string | null
          ticket_type_id?: string | null
          updated_at?: string | null
          weekly_days?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_eligibility_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule_time_window"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_eligibility_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_type"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_scope: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          scope: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id: string
          scope?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          scope?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_type: {
        Row: {
          age_category: string | null
          created_at: string
          deleted_at: string | null
          event_id: string
          id: string
          is_active: boolean
          max_per_order: number
          name: string
          price: number
          scope: string
          updated_at: string | null
        }
        Insert: {
          age_category?: string | null
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          max_per_order: number
          name: string
          price: number
          scope: string
          updated_at?: string | null
        }
        Update: {
          age_category?: string | null
          created_at?: string
          deleted_at?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          max_per_order?: number
          name?: string
          price?: number
          scope?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_type_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_type_scope_fkey"
            columns: ["scope"]
            isOneToOne: false
            referencedRelation: "ticket_scope"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string | null
          device_id: string
          device_type: Database["public"]["Enums"]["device_type_enum"] | null
          fcm_token: string
          model: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          device_type?: Database["public"]["Enums"]["device_type_enum"] | null
          fcm_token: string
          model?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          device_type?: Database["public"]["Enums"]["device_type_enum"] | null
          fcm_token?: string
          model?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          id: string
          is_read: boolean | null
          notification_id: string | null
          read_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_id?: string | null
          read_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          is_read?: boolean | null
          notification_id?: string | null
          read_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string | null
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string | null
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      venue_general_attributes: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          type: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      venue_products: {
        Row: {
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          name: string
          price: number
          start_date: string
          type: Database["public"]["Enums"]["venue_products_type_enum"]
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          price: number
          start_date?: string
          type?: Database["public"]["Enums"]["venue_products_type_enum"]
          updated_at?: string | null
          venue_id?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          price?: number
          start_date?: string
          type?: Database["public"]["Enums"]["venue_products_type_enum"]
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_products_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          attribute_ids: string[] | null
          business_hours: Json | null
          card_details: string | null
          contact_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          email: string | null
          gallery_id: string | null
          id: string
          image_featured_id: string | null
          is_active: boolean | null
          location_latitude: string | null
          location_longitude: string | null
          name: string | null
          order_display: string | null
          phone_no: string | null
          updated_at: string | null
          venue_category_id: string[] | null
        }
        Insert: {
          address?: string | null
          attribute_ids?: string[] | null
          business_hours?: Json | null
          card_details?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          gallery_id?: string | null
          id?: string
          image_featured_id?: string | null
          is_active?: boolean | null
          location_latitude?: string | null
          location_longitude?: string | null
          name?: string | null
          order_display?: string | null
          phone_no?: string | null
          updated_at?: string | null
          venue_category_id?: string[] | null
        }
        Update: {
          address?: string | null
          attribute_ids?: string[] | null
          business_hours?: Json | null
          card_details?: string | null
          contact_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          email?: string | null
          gallery_id?: string | null
          id?: string
          image_featured_id?: string | null
          is_active?: boolean | null
          location_latitude?: string | null
          location_longitude?: string | null
          name?: string | null
          order_display?: string | null
          phone_no?: string | null
          updated_at?: string | null
          venue_category_id?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_policy_to_authenticated_users: {
        Args: { permission_type: string; table_name: string }
        Returns: undefined
      }
      apply_policies_to_table: {
        Args: { target_table_name: string }
        Returns: undefined
      }
      check_user_permission_with_claims: {
        Args: { action_required: string; table_name: string }
        Returns: boolean
      }
      get_app_menu: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          category_title: string
          children: Json
          href: string
          icon: string
          id: string
          label: string
          menu_id: string
          menu_label: string
          parent_id: string
          parent_name: string
          priority: string
        }[]
      }
      get_events_near_location: {
        Args: { lat: number; lng: number; radius_km?: number }
        Returns: {
          distance_km: number
          id: string
          location_latitude: number
          location_longitude: number
          start_date: string
          title: string
        }[]
      }
      get_menus_options: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          category_title: string
          href: string
          icon: string
          id: string
          label: string
          menu_id: string
          menu_label: string
          parent_id: string
          parent_name: string
          priority: string
        }[]
      }
      get_roles_and_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      search_events_by_tags: {
        Args: { search_tags: string[] }
        Returns: {
          id: string
          matching_tags: number
          tags: Json
          title: string
        }[]
      }
    }
    Enums: {
      device_type_enum: "Android" | "iOS" | "Desktop" | "Web" | "Unknown"
      frequency_enum: "one_time" | "daily" | "weekly" | "monthly"
      occurrence_status_enum: "open" | "sold_out" | "blocked"
      ticket_scope_enum:
        | "occurrence"
        | "multi_day"
        | "weekly_pass"
        | "monthly_pass"
      tickets_frequency_enum: "daily" | "weekly" | "monthly"
      venue_products_type_enum: "bookable" | "simple"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      device_type_enum: ["Android", "iOS", "Desktop", "Web", "Unknown"],
      frequency_enum: ["one_time", "daily", "weekly", "monthly"],
      occurrence_status_enum: ["open", "sold_out", "blocked"],
      ticket_scope_enum: [
        "occurrence",
        "multi_day",
        "weekly_pass",
        "monthly_pass",
      ],
      tickets_frequency_enum: ["daily", "weekly", "monthly"],
      venue_products_type_enum: ["bookable", "simple"],
    },
  },
} as const
